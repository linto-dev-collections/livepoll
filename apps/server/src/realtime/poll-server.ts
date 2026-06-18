import {
  type Connection,
  type ConnectionContext,
  Server,
  type WSMessage,
} from "partyserver";
import { DomainError } from "../domain/errors/domain.error";
import { createPollRepository } from "../infrastructure/repositories/poll.repository";
import { createVoteRepository } from "../infrastructure/repositories/vote.repository";
import { createCastVoteService } from "../use-cases/poll/cast-vote.service";
import { type ServerMessage, voteMessageSchema } from "./protocol";

/**
 * DO が必要とする env の最小サブセット。
 * apps/server スコープでは `Cloudflare.Env` は空のため明示的に型付けする。
 */
type PollServerEnv = {
  DB: D1Database;
  CORS_ORIGIN: string;
};

/**
 * 1 接続あたりのメッセージ流量制限（連打・スクリプト flood の抑止）。
 * 正常な参加者は原則 1 投票のため上限は緩めで良い。
 */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10_000;

/** レート制限カウンタ（接続状態として保持し、ハイバネーション後も維持される）。 */
type RateLimitState = { windowStart: number; count: number };

/**
 * 投票ルームの Durable Object（PartyServer）。
 *
 * - ルーム名 `this.name` = pollId（参加者は joinCode → pollId 解決後に接続）。
 * - 投票の検証・永続化は castVote use-case 経由（サーバ権威）。集計・接続人数を broadcast。
 * - 状態（集計・status）は常に D1 から読み出すため、ハイバネーション／再起動後も保持される
 *   （D1 が source of truth。DO 内にキャッシュを持たない）。
 * - 参加人数は `participant` タグ（voterKey を持つ接続）のみを数える。ホストの観戦接続
 *   （observer）は数えない。
 */
export class Poll extends Server<PollServerEnv> {
  static options = { hibernate: true };

  private pollRepo() {
    return createPollRepository(this.env.DB);
  }

  private voteRepo() {
    return createVoteRepository(this.env.DB);
  }

  private send(conn: Connection, msg: ServerMessage): void {
    conn.send(JSON.stringify(msg));
  }

  /**
   * 参加人数（ユニークな voterKey の数）。
   *
   * 1 ブラウザ = 1 voterKey = 1 票という設計に揃え、接続（タブ）数ではなく
   * 重複排除した voterKey 数で数える。同一ブラウザで複数タブを開いても 1 人として数え、
   * 最後のタブを閉じたときに初めて減る（getConnections は現在開いている接続のみ返し、
   * onClose のたびに再計算される）。observer（ホスト観戦）は participant タグが付かず対象外。
   */
  private participantCount(): number {
    const voterKeys = new Set<string>();
    for (const conn of this.getConnections("participant")) {
      const key = this.voterKeyOf(conn);
      if (key) voterKeys.add(key);
    }
    return voterKeys.size;
  }

  /** 接続の元 URI（ハイバネーション後も保持）から voterKey を取り出す。 */
  private voterKeyOf(conn: Connection): string | null {
    if (!conn.uri) return null;
    try {
      return new URL(conn.uri).searchParams.get("voterKey");
    } catch {
      return null;
    }
  }

  /**
   * 同一 voterKey の全接続（＝同じブラウザの複数タブ）へ「投票済み」を配信する。
   * 投票した接続だけに送ると、投票前から開いていた他タブはボタンが押せたままになり
   * （youVoted が更新されない）、再度押すと ALREADY_VOTED エラーになる。全タブへ配信して
   * 即座に投票済み状態（結果表示）へ揃える。投票した接続自身もこの集合に含まれる。
   */
  private sendVotedToVoter(voterKey: string, optionId: string): void {
    for (const conn of this.getConnections("participant")) {
      if (this.voterKeyOf(conn) === voterKey) {
        this.send(conn, { type: "voted", optionId });
      }
    }
  }

  /** 最新集計と参加人数を全員へ配信する。 */
  private async broadcastTally(): Promise<void> {
    const voteRepo = this.voteRepo();
    const [tallies, totalVotes] = await Promise.all([
      voteRepo.tally(this.name),
      voteRepo.total(this.name),
    ]);
    this.broadcast(
      JSON.stringify({
        type: "tally",
        tallies,
        totalVotes,
        participants: this.participantCount(),
      } satisfies ServerMessage),
    );
  }

  /**
   * 接続元 Origin の許可リスト検証（CSWSH = クロスサイト WebSocket 乗っ取り対策）。
   *
   * - 許可リストは `CORS_ORIGIN`（カンマ区切り）で、HTTP の CORS（app.ts）と**同一解釈**。
   *   参加ページ・ホスト画面はいずれも web アプリのオリジン（CORS_ORIGIN に含む）から接続する。
   * - Origin ヘッダはブラウザが必ず付与する。欠落時（curl 等の非ブラウザ直結）は
   *   ブラウザ横断攻撃の経路ではないため許可する。
   * - **多層防御の一層**に過ぎない。Origin はブラウザ以外から詐称可能なため、本質的な
   *   境界は「サーバ権威の投票検証（cast-vote）」と「公開済み集計のみ配信」である。
   */
  private isAllowedOrigin(request: Request): boolean {
    const origin = request.headers.get("Origin");
    if (!origin) return true;
    const allowed = this.env.CORS_ORIGIN.split(",").map((o) => o.trim());
    return allowed.includes(origin);
  }

  /**
   * 1 接続あたりのメッセージ流量を制限する（slide-free な固定ウィンドウカウンタ）。
   * カウンタは `conn.setState` に保持するためハイバネーション後も維持され、
   * ウィンドウ経過後は自然にリセットされる。
   * @returns 許可されたら true、上限超過なら false。
   */
  private allowMessage(conn: Connection): boolean {
    const now = Date.now();
    const prev = conn.state as RateLimitState | null;
    const withinWindow =
      prev !== null && now - prev.windowStart < RATE_LIMIT_WINDOW_MS;
    const windowStart = withinWindow ? prev.windowStart : now;
    const count = withinWindow ? prev.count + 1 : 1;
    conn.setState({ windowStart, count });
    return count <= RATE_LIMIT_MAX;
  }

  getConnectionTags(_conn: Connection, ctx: ConnectionContext): string[] {
    const voterKey = new URL(ctx.request.url).searchParams.get("voterKey");
    // voterKey ありは投票者（聴衆）、なしは観戦者（ホストのライブ閲覧等）
    return voterKey ? ["participant"] : ["observer"];
  }

  async onConnect(conn: Connection, ctx: ConnectionContext): Promise<void> {
    if (!this.isAllowedOrigin(ctx.request)) {
      conn.close(1008, "forbidden origin");
      return;
    }

    const poll = await this.pollRepo().findByIdWithOptions(this.name);
    if (!poll) {
      this.send(conn, {
        type: "error",
        code: "NOT_FOUND",
        message: "投票が見つかりません",
      });
      conn.close(1011, "poll not found");
      return;
    }

    const voteRepo = this.voteRepo();
    const voterKey = this.voterKeyOf(conn);
    const [tallies, totalVotes, youVoted] = await Promise.all([
      voteRepo.tally(this.name),
      voteRepo.total(this.name),
      voterKey
        ? voteRepo.findVotedOption(this.name, voterKey)
        : Promise.resolve(null),
    ]);

    this.send(conn, {
      type: "state",
      status: poll.status,
      options: poll.options.map((o) => ({ id: o.id, label: o.label })),
      tallies,
      totalVotes,
      participants: this.participantCount(),
      youVoted,
    });

    // 参加人数の増加を他の接続にも反映
    await this.broadcastTally();
  }

  async onClose(): Promise<void> {
    // 参加人数の減少を反映
    await this.broadcastTally();
  }

  async onMessage(conn: Connection, message: WSMessage): Promise<void> {
    // レート制限（全 inbound メッセージが対象。不正 JSON の flood も抑止する）。
    if (!this.allowMessage(conn)) {
      this.send(conn, {
        type: "error",
        code: "RATE_LIMITED",
        message: "操作が多すぎます。しばらくしてからお試しください。",
      });
      return;
    }

    let payload: unknown;
    try {
      const raw =
        typeof message === "string"
          ? message
          : new TextDecoder().decode(message);
      payload = JSON.parse(raw);
    } catch {
      this.send(conn, {
        type: "error",
        code: "BAD_REQUEST",
        message: "不正なメッセージです",
      });
      return;
    }

    const parsed = voteMessageSchema.safeParse(payload);
    if (!parsed.success) {
      this.send(conn, {
        type: "error",
        code: "BAD_REQUEST",
        message: "不正なメッセージです",
      });
      return;
    }

    // voterKey は接続時の URI に固定（なりすまし防止）。観戦者は投票不可。
    const voterKey = this.voterKeyOf(conn);
    if (!voterKey) {
      this.send(conn, {
        type: "error",
        code: "FORBIDDEN",
        message: "投票できません",
      });
      return;
    }

    const castVote = createCastVoteService({
      pollRepo: this.pollRepo(),
      voteRepo: this.voteRepo(),
    });
    try {
      await castVote.execute({
        pollId: this.name,
        optionId: parsed.data.optionId,
        voterKey,
      });
      // 同一 voterKey の全タブを「投票済み」に揃える（投票した接続自身も含む）。
      this.sendVotedToVoter(voterKey, parsed.data.optionId);
      await this.broadcastTally();
    } catch (error) {
      // use-case の DomainError を WS の error メッセージへ翻訳（内部情報は出さない）
      const code = error instanceof DomainError ? error.code : "INTERNAL";
      this.send(conn, { type: "error", code, message: errorMessage(code) });
    }
  }

  /**
   * 状態変更（公開/締切）を D1 から読み直して全員へ配信する。
   * 管理 API（poll.route）から `getServerByName(...).refreshAndBroadcastStatus()` で呼ぶ。
   */
  async refreshAndBroadcastStatus(): Promise<void> {
    const poll = await this.pollRepo().findByIdWithOptions(this.name);
    if (!poll) return;
    this.broadcast(
      JSON.stringify({
        type: "status",
        status: poll.status,
      } satisfies ServerMessage),
    );
  }
}

/** クライアント向けの汎用エラー文言（内部詳細・スタックは出さない）。 */
function errorMessage(code: string): string {
  switch (code) {
    case "POLL_NOT_OPEN":
      return "この投票は現在受付中ではありません";
    case "ALREADY_VOTED":
      return "すでに投票済みです";
    case "INVALID_OPTION":
      return "不正な選択肢です";
    case "NOT_FOUND":
      return "投票が見つかりません";
    default:
      return "エラーが発生しました";
  }
}

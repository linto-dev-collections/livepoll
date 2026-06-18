/**
 * Poll DO（PartyServer）の WebSocket メッセージ契約（サーバ → クライアント）。
 *
 * API レスポンスではなく WS プロトコルのため、ここでローカル定義する
 * （server 側 `realtime/protocol.ts` の ServerMessage と対応）。観戦者
 * （ホストのライブ閲覧）は voted / error を受け取らないため、購読側で扱う
 * state / tally / status のみを利用する。
 */

export type PollStatus = "draft" | "open" | "closed";

type OptionView = { id: string; label: string };

export type ServerMessage =
  | {
      type: "state";
      status: PollStatus;
      options: OptionView[];
      tallies: Record<string, number>;
      totalVotes: number;
      participants: number;
      youVoted: string | null;
    }
  | {
      type: "tally";
      tallies: Record<string, number>;
      totalVotes: number;
      participants: number;
    }
  | { type: "status"; status: PollStatus }
  | { type: "voted"; optionId: string }
  | { type: "error"; code: string; message: string };

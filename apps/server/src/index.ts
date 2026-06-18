import { getServerByName, routePartykitRequest } from "partyserver";
import app from "./app";
import type { AppEnv } from "./types";

// 投票ルームの Durable Object。Worker エントリから export することで workerd に登録される。
export { Poll } from "./realtime/poll-server";

/**
 * `/parties/poll/<room>` の room（= pollId）を取り出す。それ以外は null。
 * routePartykitRequest の既定 prefix "parties" と、binding `Poll`（kebab → "poll"）に対応。
 */
function pollRoomOf(request: Request): string | null {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  if (parts[0] !== "parties" || parts[1] !== "poll") return null;
  return parts[2] ?? null;
}

export default {
  async fetch(
    request: Request,
    env: AppEnv["Bindings"],
    ctx: ExecutionContext,
  ): Promise<Response> {
    const room = pollRoomOf(request);
    if (room) {
      // PartyServer の routePartykitRequest はルーム名を `ctx.id.name` にのみ依存し、
      // `__ps_name` の永続化も `x-partykit-room` の付与も行わない。`ctx.id.name` は新しい
      // workerd（2026-03-26 以降）でしか populated されず、ローカル（alchemy 同梱の旧
      // miniflare）や古い compatibility date では undefined になる。
      //
      // その状態だと、DO 名は `__ps_name` 永続レコードからしか復元できないが、初回 WS 接続
      // （routePartykitRequest 経由）はそれを書き込まないため、ハイバネーション復帰時の
      // `webSocketClose` / `webSocketMessage` で `this.name` 解決に失敗する
      // （= getServerByName で一度も bootstrap されていない下書き投票で発生）。
      //
      // そこで接続前に getServerByName（内部で setName）を呼び、`__ps_name` を永続化しておく。
      // これにより初回 fetch・ハイバネーション復帰のいずれでも名前を解決できる。
      // `ctx.id.name` が使える環境では setName は同名で no-op 相当となり無害。
      await getServerByName(env.Poll, room);
    }
    // /parties/poll/:pollId は PartyServer（Poll DO）へ、それ以外は Hono へ。
    return (
      (await routePartykitRequest(request, env)) ?? app.fetch(request, env, ctx)
    );
  },
} satisfies ExportedHandler<AppEnv["Bindings"]>;

export type { AppType } from "./app";

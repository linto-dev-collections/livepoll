/**
 * Server Hono RPC から型を導出する（CLAUDE.md §5.1: 手動 type 定義禁止）。
 */
import type { InferResponseType } from "@livepoll/server/hc";
import type { api } from "@/lib/api";

/** 投票詳細（GET /api/polls/:id）。options を含む。 */
export type PollDetail = InferResponseType<
  (typeof api.api.polls)[":id"]["$get"],
  200
>;

/** 選択肢 1 件。 */
export type PollOption = PollDetail["options"][number];

/** 投票の状態（draft / open / closed）。 */
export type PollStatus = PollDetail["status"];

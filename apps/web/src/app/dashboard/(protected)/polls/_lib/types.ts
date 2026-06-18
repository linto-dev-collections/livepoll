/**
 * Server Hono RPC から型を導出する（CLAUDE.md §5.1: 手動 type 定義禁止）。
 */
import type { InferResponseType } from "@livepoll/server/hc";
import type { api } from "@/lib/api";

/**
 * 投票一覧の 1 行（GET /api/polls）。
 * Date 型は JSON シリアライズを経て string になる点に注意。
 */
export type PollListItem = InferResponseType<
  typeof api.api.polls.$get,
  200
>[number];

/** 投票の状態（draft / open / closed）。 */
export type PollStatus = PollListItem["status"];

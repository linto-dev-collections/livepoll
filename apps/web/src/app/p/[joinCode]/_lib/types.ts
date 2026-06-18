/**
 * Server Hono RPC から型を導出する（CLAUDE.md §5.1: 手動 type 定義禁止）。
 */
import type { InferResponseType } from "@livepoll/server/hc";
import type { api } from "@/lib/api";

/**
 * 参加者向け公開スナップショット（GET /api/public/polls/:joinCode）。
 * draft は返らない（サーバが 404）。pollId / question / options / status のみ。
 */
export type PublicPoll = InferResponseType<
  (typeof api.api.public.polls)[":joinCode"]["$get"],
  200
>;

/** 投票の状態（draft / open / closed）。 */
export type PollStatus = PublicPoll["status"];

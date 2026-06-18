import { z } from "zod";
import type { PollStatus } from "../domain/types/poll";

/**
 * WebSocket メッセージプロトコル（参加者・ホスト共通）。
 *
 * - クライアント→サーバ：投票のみ。`voterKey` は **メッセージに含めない**
 *   （接続時の URI に固定し、なりすましを防ぐ。poll-server.ts 参照）。
 * - サーバ→クライアント：state / tally / status / voted / error。
 * - `@livepoll/shared/schemas`（dep-cruiser で routes 専用）には置かず realtime 層内に定義する。
 */

export const voteMessageSchema = z.object({
  type: z.literal("vote"),
  optionId: z.string().min(1),
});

export type VoteMessage = z.infer<typeof voteMessageSchema>;

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

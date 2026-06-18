import { vote } from "@livepoll/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { and, count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

/** SQLite / D1 の UNIQUE 制約違反かどうかを判定する。 */
function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error && /UNIQUE constraint failed/i.test(error.message)
  );
}

export function createVoteRepository(d1: D1Database) {
  const db = drizzle(d1);

  return {
    /**
     * 1 票を記録する。
     * UNIQUE(poll_id, voter_key) 違反（＝同一ブラウザの二重投票）は握り潰して
     * `{ inserted: false }` を返す（重複判定をアトミックに行う）。
     */
    async create(input: {
      pollId: string;
      optionId: string;
      voterKey: string;
    }): Promise<{ inserted: boolean }> {
      try {
        await db.insert(vote).values({
          id: createId(),
          pollId: input.pollId,
          pollOptionId: input.optionId,
          voterKey: input.voterKey,
        });
        return { inserted: true };
      } catch (error) {
        if (isUniqueViolation(error)) {
          return { inserted: false };
        }
        throw error;
      }
    },

    /** 選択肢ごとの得票数（poll_id でスコープ）。 */
    async tally(pollId: string): Promise<Record<string, number>> {
      const rows = await db
        .select({ optionId: vote.pollOptionId, votes: count() })
        .from(vote)
        .where(eq(vote.pollId, pollId))
        .groupBy(vote.pollOptionId)
        .all();
      const result: Record<string, number> = {};
      for (const row of rows) {
        result[row.optionId] = Number(row.votes);
      }
      return result;
    },

    /** 総投票数。 */
    async total(pollId: string): Promise<number> {
      const [row] = await db
        .select({ votes: count() })
        .from(vote)
        .where(eq(vote.pollId, pollId))
        .all();
      return Number(row?.votes ?? 0);
    },

    /** 当該 voter_key が投票済みか。 */
    async hasVoted(pollId: string, voterKey: string): Promise<boolean> {
      const row = await db
        .select({ id: vote.id })
        .from(vote)
        .where(and(eq(vote.pollId, pollId), eq(vote.voterKey, voterKey)))
        .get();
      return row !== undefined;
    },

    /** 当該 voter_key が投票した選択肢 ID（未投票なら null）。接続時の youVoted 用。 */
    async findVotedOption(
      pollId: string,
      voterKey: string,
    ): Promise<string | null> {
      const row = await db
        .select({ optionId: vote.pollOptionId })
        .from(vote)
        .where(and(eq(vote.pollId, pollId), eq(vote.voterKey, voterKey)))
        .get();
      return row?.optionId ?? null;
    },
  };
}

import { poll, pollOption } from "@livepoll/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type {
  Poll,
  PollOption,
  PollStatus,
  PollWithOptions,
} from "../../domain/types/poll";

type PollRow = typeof poll.$inferSelect;
type PollOptionRow = typeof pollOption.$inferSelect;

function toPoll(row: PollRow): Poll {
  return {
    id: row.id,
    organizationId: row.organizationId,
    createdByUserId: row.createdByUserId,
    question: row.question,
    status: row.status,
    joinCode: row.joinCode,
    openedAt: row.openedAt,
    closedAt: row.closedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toOption(row: PollOptionRow): PollOption {
  return {
    id: row.id,
    pollId: row.pollId,
    label: row.label,
    position: row.position,
  };
}

export function createPollRepository(d1: D1Database) {
  const db = drizzle(d1);

  async function loadWithOptions(id: string): Promise<PollWithOptions | null> {
    const pollRow = await db.select().from(poll).where(eq(poll.id, id)).get();
    if (!pollRow) return null;
    const optionRows = await db
      .select()
      .from(pollOption)
      .where(eq(pollOption.pollId, id))
      .orderBy(asc(pollOption.position))
      .all();
    return { ...toPoll(pollRow), options: optionRows.map(toOption) };
  }

  return {
    /** join_code の存在確認（一意性チェック用）。 */
    async existsByJoinCode(code: string): Promise<boolean> {
      const row = await db
        .select({ id: poll.id })
        .from(poll)
        .where(eq(poll.joinCode, code))
        .get();
      return row !== undefined;
    },

    /**
     * 投票（draft）＋選択肢を作成する。
     * D1 はインタラクティブトランザクションが無いため poll → options の順に逐次 insert する。
     */
    async create(input: {
      organizationId: string;
      createdByUserId: string | null;
      question: string;
      joinCode: string;
      options: { label: string; position: number }[];
    }): Promise<PollWithOptions> {
      const pollId = createId();
      await db.insert(poll).values({
        id: pollId,
        organizationId: input.organizationId,
        createdByUserId: input.createdByUserId,
        question: input.question,
        joinCode: input.joinCode,
        status: "draft",
      });
      if (input.options.length > 0) {
        await db.insert(pollOption).values(
          input.options.map((o) => ({
            id: createId(),
            pollId,
            label: o.label,
            position: o.position,
          })),
        );
      }
      const created = await loadWithOptions(pollId);
      if (!created) {
        throw new Error(`Failed to load created poll: ${pollId}`);
      }
      return created;
    },

    /** active org の投票一覧（作成日時の降順）。 */
    async listByOrg(organizationId: string): Promise<Poll[]> {
      const rows = await db
        .select()
        .from(poll)
        .where(eq(poll.organizationId, organizationId))
        .orderBy(desc(poll.createdAt))
        .all();
      return rows.map(toPoll);
    },

    /** 組織スコープ付き取得。別組織の投票は null（IDOR 防止）。 */
    async findByIdForOrg(
      id: string,
      organizationId: string,
    ): Promise<PollWithOptions | null> {
      const pollRow = await db
        .select()
        .from(poll)
        .where(and(eq(poll.id, id), eq(poll.organizationId, organizationId)))
        .get();
      if (!pollRow) return null;
      const optionRows = await db
        .select()
        .from(pollOption)
        .where(eq(pollOption.pollId, id))
        .orderBy(asc(pollOption.position))
        .all();
      return { ...toPoll(pollRow), options: optionRows.map(toOption) };
    },

    /** 組織非依存の取得（DO/公開用・Phase 2）。 */
    findByIdWithOptions(id: string): Promise<PollWithOptions | null> {
      return loadWithOptions(id);
    },

    /** join_code から取得（公開参加用・Phase 2）。 */
    async findByJoinCode(joinCode: string): Promise<PollWithOptions | null> {
      const pollRow = await db
        .select()
        .from(poll)
        .where(eq(poll.joinCode, joinCode))
        .get();
      if (!pollRow) return null;
      const optionRows = await db
        .select()
        .from(pollOption)
        .where(eq(pollOption.pollId, pollRow.id))
        .orderBy(asc(pollOption.position))
        .all();
      return { ...toPoll(pollRow), options: optionRows.map(toOption) };
    },

    /**
     * 投票内容（question / options）を更新する。
     * options が指定された場合は全削除→再 insert する（draft のみ呼ばれる前提＝votes 無し）。
     */
    async updateContent(
      id: string,
      input: {
        question?: string;
        options?: { label: string; position: number }[];
      },
    ): Promise<void> {
      const pollPatch = {
        ...(input.question !== undefined ? { question: input.question } : {}),
        updatedAt: new Date(),
      };

      if (input.question !== undefined) {
        await db.update(poll).set(pollPatch).where(eq(poll.id, id));
      } else if (input.options !== undefined) {
        await db.update(poll).set(pollPatch).where(eq(poll.id, id));
      }
      if (input.options !== undefined) {
        await db.delete(pollOption).where(eq(pollOption.pollId, id));
        if (input.options.length > 0) {
          await db.insert(pollOption).values(
            input.options.map((o) => ({
              id: createId(),
              pollId: id,
              label: o.label,
              position: o.position,
            })),
          );
        }
      }
    },

    /** 状態遷移（公開/締切）。openedAt/closedAt を併せて更新する。 */
    async updateStatus(
      id: string,
      status: PollStatus,
      timestamps: { openedAt?: Date; closedAt?: Date },
    ): Promise<void> {
      await db
        .update(poll)
        .set({
          status,
          ...(timestamps.openedAt ? { openedAt: timestamps.openedAt } : {}),
          ...(timestamps.closedAt ? { closedAt: timestamps.closedAt } : {}),
        })
        .where(eq(poll.id, id));
    },

    /** 投票を削除（FK CASCADE で options/votes も削除）。 */
    async delete(id: string): Promise<void> {
      await db.delete(poll).where(eq(poll.id, id));
    },
  };
}

import { relations, sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { organization, user } from "./auth";

export const poll = sqliteTable(
  "poll",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    // 作成者は退会で消えても投票は残すため NULL 許容 + SET NULL
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    question: text("question").notNull(),
    status: text("status", { enum: ["draft", "open", "closed"] })
      .default("draft")
      .notNull(),
    joinCode: text("join_code").notNull().unique(),
    openedAt: integer("opened_at", { mode: "timestamp_ms" }),
    closedAt: integer("closed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("poll_organizationId_idx").on(table.organizationId),
    index("poll_organization_status_idx").on(
      table.organizationId,
      table.status,
    ),
  ],
);

export const pollOption = sqliteTable(
  "poll_option",
  {
    id: text("id").primaryKey(),
    pollId: text("poll_id")
      .notNull()
      .references(() => poll.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    // 表示順（0 始まり、アプリが採番。位置情報のため DB デフォルトは持たない）
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // 同一投票内の選択肢文言の重複を禁止
    uniqueIndex("poll_option_poll_label_uidx").on(table.pollId, table.label),
    // vote の複合 FK ターゲット（(id, poll_id) の整合担保用）
    uniqueIndex("poll_option_id_poll_uidx").on(table.id, table.pollId),
    index("poll_option_poll_position_idx").on(table.pollId, table.position),
  ],
);

export const vote = sqliteTable(
  "vote",
  {
    id: text("id").primaryKey(),
    pollId: text("poll_id")
      .notNull()
      .references(() => poll.id, { onDelete: "cascade" }),
    pollOptionId: text("poll_option_id").notNull(),
    // ブラウザ単位の匿名キー（クライアント生成）。個人特定情報は保持しない
    voterKey: text("voter_key").notNull(),
    // 投票は不変のため updated_at は持たない
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    // 1 人（同一ブラウザ）1 票
    uniqueIndex("vote_poll_voter_uidx").on(table.pollId, table.voterKey),
    // 集計（WHERE poll_id=? GROUP BY poll_option_id）
    index("vote_poll_option_idx").on(table.pollId, table.pollOptionId),
    // 選択肢 FK の逆引き／カスケード
    index("vote_option_idx").on(table.pollOptionId),
    // vote.(poll_option_id, poll_id) → poll_option.(id, poll_id)
    // poll_option.poll_id と vote.poll_id の不整合を防ぎつつ option 削除で cascade
    foreignKey({
      name: "vote_option_fk",
      columns: [table.pollOptionId, table.pollId],
      foreignColumns: [pollOption.id, pollOption.pollId],
    }).onDelete("cascade"),
  ],
);

export const pollRelations = relations(poll, ({ one, many }) => ({
  organization: one(organization, {
    fields: [poll.organizationId],
    references: [organization.id],
  }),
  createdBy: one(user, {
    fields: [poll.createdByUserId],
    references: [user.id],
  }),
  options: many(pollOption),
  votes: many(vote),
}));

export const pollOptionRelations = relations(pollOption, ({ one, many }) => ({
  poll: one(poll, { fields: [pollOption.pollId], references: [poll.id] }),
  votes: many(vote),
}));

export const voteRelations = relations(vote, ({ one }) => ({
  poll: one(poll, { fields: [vote.pollId], references: [poll.id] }),
  option: one(pollOption, {
    fields: [vote.pollOptionId],
    references: [pollOption.id],
  }),
}));

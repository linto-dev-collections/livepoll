import { Hono } from "hono";
import { createPollRepository } from "../infrastructure/repositories/poll.repository";
import type { AppEnv } from "../types";

/**
 * 参加者向け公開スナップショット API（**認証なし**）。
 *
 * - joinCode から投票の最小情報のみ返す（question / options / status / pollId）。
 * - `draft` は公開しない（404 で存在を秘匿）。
 * - 組織情報・作成者・内部メタは返さない（情報露出の最小化）。
 * - ライブ集計・参加人数は WebSocket（Poll DO）経由で取得する。
 */
export const publicPollRoute = new Hono<AppEnv>().get(
  "/:joinCode",
  async (c) => {
    const joinCode = c.req.param("joinCode");
    const pollRepo = createPollRepository(c.env.DB);
    const poll = await pollRepo.findByJoinCode(joinCode);

    if (!poll || poll.status === "draft") {
      return c.json({ error: "Poll not found" }, 404);
    }

    return c.json({
      pollId: poll.id,
      question: poll.question,
      options: poll.options.map((o) => ({ id: o.id, label: o.label })),
      status: poll.status,
    });
  },
);

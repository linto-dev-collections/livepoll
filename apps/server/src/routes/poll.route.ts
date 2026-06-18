import { zValidator } from "@hono/zod-validator";
import {
  createPollSchema,
  updatePollSchema,
  updatePollStatusSchema,
} from "@livepoll/shared/schemas";
import { Hono } from "hono";
import { getServerByName } from "partyserver";
import { createPollRepository } from "../infrastructure/repositories/poll.repository";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import type { AppEnv } from "../types";
import { createCreatePollService } from "../use-cases/poll/create-poll.service";
import { createDeletePollService } from "../use-cases/poll/delete-poll.service";
import { createGetPollService } from "../use-cases/poll/get-poll.service";
import { createListPollsService } from "../use-cases/poll/list-polls.service";
import { createUpdatePollService } from "../use-cases/poll/update-poll.service";
import { createUpdatePollStatusService } from "../use-cases/poll/update-poll-status.service";

/**
 * 投票管理 API（ホスト・認証必須）。
 *
 * - 全エンドポイントで authMiddleware（認証）＋ requirePermission（RBAC）。
 * - 取得・更新・削除・状態変更は activeOrganizationId でスコープし、別組織は 404（IDOR 防止）。
 */
export const pollRoute = new Hono<AppEnv>()
  .use("/*", authMiddleware)
  .get("/", requirePermission("poll", "read"), async (c) => {
    const organizationId = c.get("activeOrganizationId");
    const service = createListPollsService({
      pollRepo: createPollRepository(c.env.DB),
    });
    const polls = await service.execute(organizationId);
    return c.json(polls);
  })
  .post(
    "/",
    requirePermission("poll", "create"),
    zValidator("json", createPollSchema),
    async (c) => {
      const organizationId = c.get("activeOrganizationId");
      const user = c.get("user");
      const body = c.req.valid("json");
      const service = createCreatePollService({
        pollRepo: createPollRepository(c.env.DB),
      });
      const poll = await service.execute({
        organizationId,
        createdByUserId: user.id,
        question: body.question,
        options: body.options,
      });
      return c.json(poll, 201);
    },
  )
  .get("/:id", requirePermission("poll", "read"), async (c) => {
    const organizationId = c.get("activeOrganizationId");
    const id = c.req.param("id");
    const service = createGetPollService({
      pollRepo: createPollRepository(c.env.DB),
    });
    const poll = await service.execute(id, organizationId);
    return c.json(poll);
  })
  .patch(
    "/:id",
    requirePermission("poll", "update"),
    zValidator("json", updatePollSchema),
    async (c) => {
      const organizationId = c.get("activeOrganizationId");
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const service = createUpdatePollService({
        pollRepo: createPollRepository(c.env.DB),
      });
      const poll = await service.execute({
        id,
        organizationId,
        question: body.question,
        options: body.options,
      });
      return c.json(poll);
    },
  )
  .patch(
    "/:id/status",
    requirePermission("poll", "update"),
    zValidator("json", updatePollStatusSchema),
    async (c) => {
      const organizationId = c.get("activeOrganizationId");
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const service = createUpdatePollStatusService({
        pollRepo: createPollRepository(c.env.DB),
      });
      const poll = await service.execute({
        id,
        organizationId,
        status: body.status,
      });

      // 状態変更を Poll DO へ伝播し、参加者画面へ即時反映（best-effort）。
      // 配信に失敗しても DB の状態変更は成功しているため、リクエスト自体は失敗させない。
      try {
        const stub = await getServerByName(c.env.Poll, id);
        await stub.refreshAndBroadcastStatus();
      } catch (err) {
        console.warn(
          "[poll.route] failed to notify Poll DO of status change:",
          err,
        );
      }

      return c.json(poll);
    },
  )
  .delete("/:id", requirePermission("poll", "delete"), async (c) => {
    const organizationId = c.get("activeOrganizationId");
    const id = c.req.param("id");
    const service = createDeletePollService({
      pollRepo: createPollRepository(c.env.DB),
    });
    await service.execute({ id, organizationId });
    return c.json({ success: true });
  });

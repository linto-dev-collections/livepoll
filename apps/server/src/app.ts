import { env } from "@livepoll/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { DomainError } from "./domain/errors/domain.error";
import { routes } from "./routes";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>()
  .use(logger())
  .use(
    "/*",
    cors({
      origin: (origin) => {
        const allowed = env.CORS_ORIGIN.split(",").map((o) => o.trim());
        return allowed.includes(origin) ? origin : allowed[0];
      },
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 3600,
      credentials: true,
    }),
  )
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/", routes)
  .onError((err, c) => {
    if (err instanceof DomainError) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        PERMISSION_DENIED: 403,
        UNAUTHORIZED: 401,
        ALREADY_EXISTS: 409,
        VALIDATION_ERROR: 400,
        // 410 Gone: アカウント削除フローが進行中（middleware が user の状態を参照）
        ACCOUNT_DELETION_PENDING: 410,
        // 409 Conflict: 削除 confirm 時点で snapshot と現状が乖離（race ガード）
        OWNERSHIP_CONFLICT: 409,
        // 410 Gone: OAuth 削除フローの再認証 nonce が TTL 切れ
        REAUTH_EXPIRED: 410,
        // 409 Conflict: 受付中でない投票への投票（Phase 2 castVote）
        POLL_NOT_OPEN: 409,
        // 409 Conflict: 同一 voter_key の二重投票（Phase 2 castVote）
        ALREADY_VOTED: 409,
        // 400 Bad Request: 当該投票に属さない選択肢への投票（Phase 2 castVote）
        INVALID_OPTION: 400,
      };
      const status = statusMap[err.code] ?? 400;
      return c.json(
        {
          error: err.message,
          code: err.code,
        },
        status as 400 | 401 | 403 | 404 | 409 | 410,
      );
    }
    console.error("Unhandled error:", err);
    return c.json({ error: "Internal Server Error" }, 500);
  });

export default app;
export type AppType = typeof app;

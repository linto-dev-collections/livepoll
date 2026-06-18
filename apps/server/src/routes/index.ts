import { Hono } from "hono";
import type { AppEnv } from "../types";
import { accountRoute } from "./account.route";
import { authRoute } from "./auth.route";
import { organizationRoute } from "./organization.route";
import { pollRoute } from "./poll.route";
import { publicPollRoute } from "./public-poll.route";

export const routes = new Hono<AppEnv>()
  // Auth (BetterAuth handler + sign-up guard)
  .route("/api/auth", authRoute)
  // 現在の active organization の取得
  .route("/api/organizations", organizationRoute)
  // アカウント削除（退会）: prerequisites / delete / reauth
  .route("/api/account", accountRoute)
  // 投票管理（ホスト・認証必須 CRUD ＋ ライフサイクル）
  .route("/api/polls", pollRoute)
  // 参加者向け公開スナップショット（認証なし・最小公開）
  .route("/api/public/polls", publicPollRoute);

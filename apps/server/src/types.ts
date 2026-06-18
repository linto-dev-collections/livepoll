import type { auth } from "@livepoll/auth";
import type { Poll } from "./realtime/poll-server";

export type AppEnv = {
  Bindings: {
    DB: D1Database;
    CORS_ORIGIN: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    RESEND_API_KEY: string;
    FROM_EMAIL: string;
    COOKIE_DOMAIN: string;
    GOOGLE_SIGNIN_CLIENT_ID: string;
    GOOGLE_SIGNIN_CLIENT_SECRET: string;
    /** 投票ルームの Durable Object（PartyServer）。 */
    Poll: DurableObjectNamespace<Poll>;
  };
  Variables: {
    user: typeof auth.$Infer.Session.user;
    session: typeof auth.$Infer.Session.session;
    activeOrganizationId: string;
  };
};

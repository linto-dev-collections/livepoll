/**
 * Server Hono RPC + 共有 Zod スキーマから型を導出する（手動 type 定義禁止）。
 */
import type { InferResponseType } from "@livepoll/server/hc";
import type { OrganizationAction as SharedOrganizationAction } from "@livepoll/shared/schemas";
import type { api } from "@/lib/api";

type Prerequisites = InferResponseType<
  (typeof api.api.account)["deletion-prerequisites"]["$get"],
  200
>;

export type OwnedOrganizationSummary =
  Prerequisites["ownedOrganizations"][number];

export type OrganizationAction = SharedOrganizationAction;

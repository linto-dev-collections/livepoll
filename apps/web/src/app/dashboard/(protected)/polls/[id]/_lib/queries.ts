import { createServerApi } from "@/lib/api.server";
import { serverAuthClient, serverFetchOptions } from "@/lib/auth-server-client";
import { type ApiResult, handleApiResponse } from "@/lib/handle-api-response";
import type { PollDetail } from "./types";

/**
 * 投票詳細を取得する（組織スコープ付き。別組織は 404）。
 */
export async function getPoll(id: string): Promise<ApiResult<PollDetail>> {
  const api = await createServerApi();
  const res = await api.api.polls[":id"].$get({ param: { id } });
  return handleApiResponse<PollDetail>(res);
}

/**
 * 現在のユーザーが投票を管理（公開/締切/削除）できるかを返す。
 *
 * これは **UI の出し分け用ヒント**であり、最終判定はサーバ（requirePermission）。
 * poll の update/delete は admin / owner のみ（@livepoll/auth の permissions と一致）。
 */
export async function getCanManagePolls(): Promise<boolean> {
  const { data } = await serverAuthClient.organization.getActiveMemberRole({
    fetchOptions: await serverFetchOptions(),
  });
  const roles = (data?.role ?? "").split(",").map((r) => r.trim());
  return roles.includes("owner") || roles.includes("admin");
}

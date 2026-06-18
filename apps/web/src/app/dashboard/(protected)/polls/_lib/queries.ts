import { createServerApi } from "@/lib/api.server";
import { type ApiResult, handleApiResponse } from "@/lib/handle-api-response";
import type { PollListItem } from "./types";

/**
 * active organization の投票一覧を取得する（作成日時の降順）。
 * 認証 cookie を引き継ぐため Server-only の createServerApi() を使う。
 */
export async function listPolls(): Promise<ApiResult<PollListItem[]>> {
  const api = await createServerApi();
  const res = await api.api.polls.$get();
  return handleApiResponse<PollListItem[]>(res);
}

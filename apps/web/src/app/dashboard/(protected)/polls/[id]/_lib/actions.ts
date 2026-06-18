"use server";

import { updatePollStatusSchema } from "@livepoll/shared/schemas";
import { revalidatePath } from "next/cache";
import { createServerApi } from "@/lib/api.server";
import { type ApiResult, handleApiResponse } from "@/lib/handle-api-response";

/**
 * 投票の状態を変更する（公開 = open / 締切 = closed）。
 * サーバ側で RBAC・状態遷移の妥当性が最終判定され、結果は Poll DO へ伝播される。
 */
export async function setPollStatus(
  id: string,
  status: "open" | "closed",
): Promise<ApiResult<void>> {
  const parsed = updatePollStatusSchema.safeParse({ status });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "入力が不正です",
    };
  }

  const api = await createServerApi();
  const res = await api.api.polls[":id"].status.$patch({
    param: { id },
    json: parsed.data,
  });
  const result = await handleApiResponse<unknown>(res);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/dashboard/polls");
  revalidatePath(`/dashboard/polls/${id}`);
  return { success: true, data: undefined };
}

/**
 * 投票を削除する（選択肢・投票も FK CASCADE で削除）。
 */
export async function deletePoll(id: string): Promise<ApiResult<void>> {
  const api = await createServerApi();
  const res = await api.api.polls[":id"].$delete({ param: { id } });
  const result = await handleApiResponse<unknown>(res);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/dashboard/polls");
  return { success: true, data: undefined };
}

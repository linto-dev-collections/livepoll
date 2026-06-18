"use server";

import { createPollSchema } from "@livepoll/shared/schemas";
import { revalidatePath } from "next/cache";
import { createServerApi } from "@/lib/api.server";
import { type ApiResult, handleApiResponse } from "@/lib/handle-api-response";

/**
 * 投票（draft）を作成する。
 * 入力は共有 zod スキーマ（createPollSchema）で検証し、サーバ側でも再検証される。
 * 成功時は作成された投票の id を返し、呼び出し側が詳細ページへ遷移する。
 */
export async function createPoll(input: {
  question: string;
  options: string[];
}): Promise<ApiResult<{ id: string }>> {
  const parsed = createPollSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "入力が不正です",
    };
  }

  const api = await createServerApi();
  const res = await api.api.polls.$post({ json: parsed.data });
  const result = await handleApiResponse<{ id: string }>(res);
  if (result.success) {
    revalidatePath("/dashboard/polls");
  }
  return result;
}

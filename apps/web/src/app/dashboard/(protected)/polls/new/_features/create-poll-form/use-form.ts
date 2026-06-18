"use client";

import { createPollSchema } from "@livepoll/shared/schemas";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPoll } from "../../_lib/actions";

/**
 * 投票作成フォームの状態管理。
 * - 検証は共有スキーマ createPollSchema（onSubmit）。
 * - 成功時はトーストを表示し、作成された投票の詳細ページへ遷移する。
 */
export function useCreatePollForm() {
  const router = useRouter();

  return useForm({
    defaultValues: {
      question: "",
      // 最小 2 件の選択肢から開始する。
      options: ["", ""] as string[],
    },
    onSubmit: async ({ value }) => {
      const result = await createPoll({
        question: value.question,
        options: value.options,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("投票を作成しました");
      router.push(`/dashboard/polls/${result.data.id}`);
    },
    validators: {
      onSubmit: createPollSchema,
    },
  });
}

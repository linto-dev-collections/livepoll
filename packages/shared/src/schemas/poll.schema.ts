import { z } from "zod";

/**
 * 投票管理 API の入力スキーマ。
 * web (Server Action) と server (route validator) の両方で使う共有スキーマ。
 */

const questionSchema = z
  .string()
  .trim()
  .min(1, "質問を入力してください")
  .max(200, "質問は 200 文字以内で入力してください");

const optionLabelSchema = z
  .string()
  .trim()
  .min(1, "選択肢を入力してください")
  .max(100, "選択肢は 100 文字以内で入力してください");

const optionsSchema = z
  .array(optionLabelSchema)
  .min(2, "選択肢は 2 つ以上必要です")
  .max(10, "選択肢は 10 個までです")
  .superRefine((options, ctx) => {
    const seen = new Set<string>();
    for (const [index, option] of options.entries()) {
      if (seen.has(option)) {
        ctx.addIssue({
          code: "custom",
          message: "同じ選択肢は登録できません",
          path: [index],
        });
        continue;
      }
      seen.add(option);
    }
  });

export const createPollSchema = z.object({
  question: questionSchema,
  options: optionsSchema,
});

export const updatePollSchema = z.object({
  question: questionSchema.optional(),
  options: optionsSchema.optional(),
});

export const updatePollStatusSchema = z.object({
  status: z.enum(["open", "closed"]),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;
export type UpdatePollInput = z.infer<typeof updatePollSchema>;
export type UpdatePollStatusInput = z.infer<typeof updatePollStatusSchema>;

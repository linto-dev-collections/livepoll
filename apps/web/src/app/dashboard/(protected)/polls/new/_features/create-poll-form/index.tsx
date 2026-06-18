"use client";

import { Button } from "@livepoll/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@livepoll/ui/components/ui/card";
import { Input } from "@livepoll/ui/components/ui/input";
import { Label } from "@livepoll/ui/components/ui/label";
import { PlusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useCreatePollForm } from "./use-form";

const MAX_OPTIONS = 10;
const MIN_OPTIONS = 2;
const MAX_QUESTION_LENGTH = 200;
const MAX_OPTION_LENGTH = 100;

export function CreatePollForm() {
  const form = useCreatePollForm();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>投票を作成</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 質問 */}
          <form.Field name="question">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>質問</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="例: 好きなプログラミング言語は？"
                  maxLength={MAX_QUESTION_LENGTH}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* 選択肢（動的配列・2〜10） */}
          <form.Field name="options" mode="array">
            {(optionsField) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>選択肢</Label>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {optionsField.state.value.length} / {MAX_OPTIONS}
                  </span>
                </div>

                <div className="space-y-2">
                  {optionsField.state.value.map((_, i) => (
                    <form.Field key={i} name={`options[${i}]`}>
                      {(field) => (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Input
                              name={field.name}
                              placeholder={`選択肢 ${i + 1}`}
                              maxLength={MAX_OPTION_LENGTH}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`選択肢 ${i + 1} を削除`}
                              disabled={
                                optionsField.state.value.length <= MIN_OPTIONS
                              }
                              onClick={() => optionsField.removeValue(i)}
                            >
                              <XIcon className="size-4" />
                            </Button>
                          </div>
                          {field.state.meta.errors.map((error) => (
                            <p
                              key={error?.message}
                              className="text-destructive text-sm"
                            >
                              {error?.message}
                            </p>
                          ))}
                        </div>
                      )}
                    </form.Field>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={optionsField.state.value.length >= MAX_OPTIONS}
                  onClick={() => optionsField.pushValue("")}
                >
                  <PlusIcon className="mr-2 size-4" />
                  選択肢を追加
                </Button>

                {/* 配列全体のエラー（件数不足など） */}
                {optionsField.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </CardContent>

        <CardFooter className="justify-end gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard/polls" />}
          >
            キャンセル
          </Button>
          <form.Subscribe
            selector={(state) => [state.values, state.isSubmitting] as const}
          >
            {([values, isSubmitting]) => {
              const validOptions = values.options.filter(
                (o) => o.trim().length > 0,
              ).length;
              const disabled =
                isSubmitting ||
                values.question.trim().length === 0 ||
                validOptions < MIN_OPTIONS;
              return (
                <Button type="submit" disabled={disabled}>
                  {isSubmitting ? "作成中..." : "投票を作成"}
                </Button>
              );
            }}
          </form.Subscribe>
        </CardFooter>
      </Card>
    </form>
  );
}

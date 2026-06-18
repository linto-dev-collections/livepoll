"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@livepoll/ui/components/ui/alert-dialog";
import { Button } from "@livepoll/ui/components/ui/button";
import { CheckCircle2Icon, LockIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { setPollStatus } from "../../../../_lib/actions";
import type { PollStatus } from "../../../../_lib/types";

export function PollStatusActions({
  pollId,
  status,
}: {
  pollId: string;
  status: PollStatus;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  // closed は終端状態。操作不可であることを明示する。
  if (status === "closed") {
    return (
      <p className="text-muted-foreground text-sm">
        この投票は締め切られました。
      </p>
    );
  }

  const isDraft = status === "draft";
  const next = isDraft ? "open" : "closed";
  const config = isDraft
    ? {
        trigger: "公開する",
        icon: <CheckCircle2Icon className="mr-2 size-4" />,
        title: "投票を公開しますか？",
        description:
          "公開すると、参加 URL・QR コードから誰でも回答できるようになります。",
        confirm: "公開する",
        successMessage: "投票を公開しました",
        variant: "default" as const,
      }
    : {
        trigger: "締め切る",
        icon: <LockIcon className="mr-2 size-4" />,
        title: "投票を締め切りますか？",
        description:
          "締め切ると、新たな回答は受け付けられなくなります。結果は引き続き閲覧できます。",
        confirm: "締め切る",
        successMessage: "投票を締め切りました",
        variant: "outline" as const,
      };

  async function handleConfirm() {
    setPending(true);
    const result = await setPollStatus(pollId, next);
    setPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(config.successMessage);
    setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant={config.variant} />}>
        {config.icon}
        {config.trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>{config.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pending}>
            {pending ? "処理中…" : config.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

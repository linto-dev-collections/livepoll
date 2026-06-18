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
import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deletePoll } from "../../../../_lib/actions";

export function DeletePollButton({ pollId }: { pollId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deletePoll(pollId);
    if (!result.success) {
      setPending(false);
      toast.error(result.error);
      return;
    }
    toast.success("投票を削除しました");
    router.push("/dashboard/polls");
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2Icon className="mr-2 size-4" />
        投票を削除
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>投票を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は取り消せません。選択肢と投票結果もすべて削除されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending ? "削除中…" : "削除する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

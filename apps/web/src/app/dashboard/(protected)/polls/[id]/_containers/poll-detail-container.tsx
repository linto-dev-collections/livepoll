import { Button } from "@livepoll/ui/components/ui/button";
import Link from "next/link";
import { PollDetailView } from "../_features/poll-detail-view";
import { getCanManagePolls, getPoll } from "../_lib/queries";

export async function PollDetailContainer({ id }: { id: string }) {
  // 詳細取得と権限ヒントの取得を並列化。
  const [result, canManage] = await Promise.all([
    getPoll(id),
    getCanManagePolls(),
  ]);

  if (!result.success) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-muted-foreground text-sm">{result.error}</p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard/polls" />}
        >
          投票一覧へ戻る
        </Button>
      </div>
    );
  }

  return <PollDetailView poll={result.data} canManage={canManage} />;
}

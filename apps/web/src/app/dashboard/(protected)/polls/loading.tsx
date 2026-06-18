import { Skeleton } from "@livepoll/ui/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";

const ROW_KEYS = ["r1", "r2", "r3", "r4", "r5"] as const;

export default function PollsLoading() {
  return (
    <>
      <PageHeader items={[{ label: "投票" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-6">
          {/* ヘッダ + 作成ボタン */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>

          {/* 一覧テーブル */}
          <div className="rounded-lg border bg-card">
            {ROW_KEYS.map((k, i) => (
              <div
                key={k}
                className={`flex items-center gap-4 p-4 ${i > 0 ? "border-t" : ""}`}
              >
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="size-8 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

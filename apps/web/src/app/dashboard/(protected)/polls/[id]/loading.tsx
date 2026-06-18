import { Skeleton } from "@livepoll/ui/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";

const OPTION_KEYS = ["o1", "o2", "o3"] as const;

export default function PollDetailLoading() {
  return (
    <>
      <PageHeader
        items={[{ label: "投票", href: "/dashboard/polls" }, { label: "詳細" }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-6">
          {/* ヘッダ */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-8 w-72" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>

          {/* 共有 + ライブ結果 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4 rounded-lg border bg-card p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="mx-auto size-44" />
            </div>
            <div className="space-y-4 rounded-lg border bg-card p-6">
              <Skeleton className="h-5 w-24" />
              {OPTION_KEYS.map((k) => (
                <div key={k} className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { Button } from "@livepoll/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@livepoll/ui/components/ui/table";
import { BarChart3Icon, ChevronRightIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { PollStatusBadge } from "../../_components/poll-status-badge";
import type { PollListItem } from "../../_lib/types";

export function PollsView({ polls }: { polls: PollListItem[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">投票</h2>
          <p className="text-muted-foreground text-sm">
            投票を作成して、参加者の回答をリアルタイムに集計します。
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/dashboard/polls/new" />}
        >
          <PlusIcon className="mr-2 size-4" />
          投票を作成
        </Button>
      </div>

      {polls.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>質問</TableHead>
                <TableHead className="w-28">状態</TableHead>
                <TableHead className="w-44">作成日</TableHead>
                <TableHead className="w-20 text-right">詳細</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {polls.map((poll) => (
                <TableRow key={poll.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/polls/${poll.id}`}
                      className="hover:underline"
                    >
                      {poll.question}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <PollStatusBadge status={poll.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(poll.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="詳細を見る"
                      nativeButton={false}
                      render={<Link href={`/dashboard/polls/${poll.id}`} />}
                    >
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-card/50 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <BarChart3Icon className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">まだ投票がありません</p>
        <p className="text-muted-foreground text-sm">
          最初の投票を作成して、参加者からの回答を集めましょう。
        </p>
      </div>
      <Button
        nativeButton={false}
        render={<Link href="/dashboard/polls/new" />}
      >
        <PlusIcon className="mr-2 size-4" />
        投票を作成
      </Button>
    </div>
  );
}

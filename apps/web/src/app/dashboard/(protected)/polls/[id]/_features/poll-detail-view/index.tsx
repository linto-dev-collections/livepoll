import { env } from "@livepoll/env/web";
import { PollStatusBadge } from "../../../_components/poll-status-badge";
import type { PollDetail } from "../../_lib/types";
import { DeletePollButton } from "./_features/delete-poll-button";
import { LiveResults } from "./_features/live-results";
import { PollStatusActions } from "./_features/poll-status-actions";
import { SharePanel } from "./_features/share-panel";

export function PollDetailView({
  poll,
  canManage,
}: {
  poll: PollDetail;
  /** 公開/締切/削除を表示するか（admin/owner のみ。最終判定はサーバ）。 */
  canManage: boolean;
}) {
  // 参加者は内部 poll ID ではなく公開トークン（joinCode）の URL で参加する。
  const joinUrl = `${env.NEXT_PUBLIC_APP_URL}/p/${poll.joinCode}`;
  const options = poll.options.map((o) => ({ id: o.id, label: o.label }));

  return (
    <div className="space-y-6">
      {/* ヘッダ: 状態 + 質問 + ライフサイクル操作 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <PollStatusBadge status={poll.status} />
          <h1 className="font-semibold text-2xl tracking-tight">
            {poll.question}
          </h1>
        </div>
        {canManage && (
          <PollStatusActions pollId={poll.id} status={poll.status} />
        )}
      </div>

      {/* メイン: 参加導線（QR/URL）＋ ライブ結果 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SharePanel joinUrl={joinUrl} />
        <LiveResults
          pollId={poll.id}
          options={options}
          initialStatus={poll.status}
        />
      </div>

      {/* 危険な操作（管理権限がある場合のみ表示） */}
      {canManage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div>
            <p className="font-medium text-sm">投票を削除</p>
            <p className="text-muted-foreground text-sm">
              この投票と結果を完全に削除します。元に戻せません。
            </p>
          </div>
          <DeletePollButton pollId={poll.id} />
        </div>
      )}
    </div>
  );
}

import { Badge } from "@livepoll/ui/components/ui/badge";
import type { PollStatus } from "../_lib/types";

const STATUS_CONFIG: Record<PollStatus, { label: string; className: string }> =
  {
    // 下書き: 灰（控えめ）
    draft: { label: "下書き", className: "bg-muted text-muted-foreground" },
    // 受付中: 緑（実施中であることを強調）
    open: {
      label: "受付中",
      className:
        "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950",
    },
    // 締切: 黒（primary）
    closed: { label: "締切", className: "bg-foreground text-background" },
  };

/** 投票の状態を色付き Badge で表示する Presentational コンポーネント。 */
export function PollStatusBadge({ status }: { status: PollStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}

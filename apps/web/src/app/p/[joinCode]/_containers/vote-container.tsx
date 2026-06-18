import { VoteView } from "../_features/vote-view";
import type { PublicPoll } from "../_lib/types";

/**
 * 参加ページのレイアウト枠。ナビ・フッタを持たない最小構成・モバイルファースト。
 */
export function VoteContainer({ poll }: { poll: PublicPoll }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <VoteView poll={poll} />
      </div>
    </main>
  );
}

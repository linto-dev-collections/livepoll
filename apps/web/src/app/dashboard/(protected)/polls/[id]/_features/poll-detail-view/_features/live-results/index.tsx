"use client";

import { env } from "@livepoll/env/web";
import { Badge } from "@livepoll/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@livepoll/ui/components/ui/card";
import { Progress } from "@livepoll/ui/components/ui/progress";
import { RadioIcon, UsersIcon } from "lucide-react";
import { usePartySocket } from "partysocket/react";
import { useState } from "react";
import type { PollStatus, ServerMessage } from "./_lib/types";

type LiveResultsProps = {
  pollId: string;
  options: { id: string; label: string }[];
  initialStatus: PollStatus;
};

export function LiveResults({
  pollId,
  options,
  initialStatus,
}: LiveResultsProps) {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<PollStatus>(initialStatus);
  const [tallies, setTallies] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [participants, setParticipants] = useState(0);

  usePartySocket({
    // プロトコルは partysocket が host から自動判定（ローカルは ws / それ以外は wss）。
    host: new URL(env.NEXT_PUBLIC_SERVER_URL).host,
    party: "poll",
    room: pollId,
    // observer 接続: voterKey を付けないことで参加人数に計上されない（ホストのライブ閲覧）。
    onOpen: () => setConnected(true),
    onClose: () => setConnected(false),
    onMessage: (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data as string) as ServerMessage;
      } catch {
        return;
      }
      switch (msg.type) {
        case "state":
          setStatus(msg.status);
          setTallies(msg.tallies);
          setTotalVotes(msg.totalVotes);
          setParticipants(msg.participants);
          break;
        case "tally":
          setTallies(msg.tallies);
          setTotalVotes(msg.totalVotes);
          setParticipants(msg.participants);
          break;
        case "status":
          setStatus(msg.status);
          break;
        // voted / error は観戦者には届かない（投票しないため）ので無視する。
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>ライブ結果</CardTitle>
          <ConnectionBadge connected={connected} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4 text-muted-foreground text-sm">
          <span className="inline-flex items-center gap-1.5">
            <RadioIcon className="size-4" />
            総投票数{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {totalVotes}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UsersIcon className="size-4" />
            参加人数{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {participants}
            </span>
          </span>
        </div>

        {status === "draft" && (
          <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground text-sm">
            この投票はまだ公開されていません。公開すると参加者が回答できます。
          </p>
        )}
        {status === "closed" && (
          <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground text-sm">
            この投票は締め切られました。以下は最終結果です。
          </p>
        )}

        <div className="space-y-4">
          {options.map((option) => {
            const count = tallies[option.id] ?? 0;
            const percent = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
            return (
              <div key={option.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{option.label}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {count} 票 ({Math.round(percent)}%)
                  </span>
                </div>
                <Progress value={percent} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <Badge className="bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950">
      <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-current" />
      ライブ
    </Badge>
  ) : (
    <Badge variant="secondary">
      <span className="mr-1 inline-block size-1.5 rounded-full bg-current" />
      再接続中…
    </Badge>
  );
}

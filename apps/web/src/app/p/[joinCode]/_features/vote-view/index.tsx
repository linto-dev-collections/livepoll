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
import { Skeleton } from "@livepoll/ui/components/ui/skeleton";
import { CheckCircle2Icon, Loader2Icon, UsersIcon } from "lucide-react";
import { usePartySocket } from "partysocket/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PublicPoll } from "../../_lib/types";
import type { PollStatus, ServerMessage } from "./_lib/types";

const VOTER_KEY_STORAGE = "livepoll:voterKey";

export function VoteView({ poll }: { poll: PublicPoll }) {
  // 匿名識別子: ブラウザ単位で安定（個人情報は持たない不透明な乱数）。
  const [voterKey, setVoterKey] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [everConnected, setEverConnected] = useState(false);
  // 最初の state を受信したか（接続待ちの Skeleton 解除に使う）。
  const [ready, setReady] = useState(false);

  const [status, setStatus] = useState<PollStatus>(poll.status);
  const [tallies, setTallies] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [participants, setParticipants] = useState(0);
  const [youVoted, setYouVoted] = useState<string | null>(null);

  // 送信中ロック（応答 voted/error まで一時無効化）と楽観的ハイライト。
  const [pending, setPending] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  useEffect(() => {
    let stored = localStorage.getItem(VOTER_KEY_STORAGE);
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem(VOTER_KEY_STORAGE, stored);
    }
    setVoterKey(stored);
  }, []);

  const socket = usePartySocket({
    // プロトコルは host から自動判定（ローカルは ws / それ以外は wss）。
    host: new URL(env.NEXT_PUBLIC_SERVER_URL).host,
    party: "poll",
    room: poll.pollId,
    // voterKey 付きの participant 接続（参加人数に計上される）。
    query: voterKey ? { voterKey } : undefined,
    // voterKey が用意できるまで接続しない。
    enabled: voterKey !== null,
    onOpen: () => {
      setConnected(true);
      setEverConnected(true);
    },
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
          setYouVoted(msg.youVoted);
          setReady(true);
          break;
        case "tally":
          setTallies(msg.tallies);
          setTotalVotes(msg.totalVotes);
          setParticipants(msg.participants);
          break;
        case "status":
          setStatus(msg.status);
          break;
        case "voted":
          setYouVoted(msg.optionId);
          setPending(false);
          break;
        case "error":
          // 失敗（締切・既投票など）: ロック解除し理由を提示。
          // youVoted はサーバの state で正しく復元される。
          setPending(false);
          setSelectedOptionId(null);
          toast.error(msg.message);
          break;
      }
    },
  });

  const canVote =
    status === "open" && youVoted === null && !pending && connected;
  const chosenId = youVoted ?? selectedOptionId;

  function handleVote(optionId: string) {
    if (!canVote) return;
    setPending(true);
    setSelectedOptionId(optionId);
    socket.send(JSON.stringify({ type: "vote", optionId }));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl leading-snug">
            {poll.question}
          </CardTitle>
          <ConnectionBadge
            connected={connected}
            everConnected={everConnected}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <StatusBanner status={status} youVoted={youVoted} />

        {ready ? (
          <div className="space-y-3">
            {poll.options.map((option) => {
              const count = tallies[option.id] ?? 0;
              const percent = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
              const isChosen = chosenId === option.id;
              const showSpinner = pending && selectedOptionId === option.id;
              return (
                <div key={option.id} className="space-y-1.5">
                  <button
                    type="button"
                    aria-pressed={isChosen}
                    disabled={!canVote}
                    onClick={() => handleVote(option.id)}
                    className={[
                      "flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors",
                      canVote
                        ? "hover:border-primary hover:bg-accent active:translate-y-px"
                        : "cursor-default",
                      isChosen
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border",
                    ].join(" ")}
                  >
                    <span className="font-medium">{option.label}</span>
                    {showSpinner ? (
                      <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
                    ) : isChosen ? (
                      <CheckCircle2Icon className="size-5 shrink-0 text-primary" />
                    ) : null}
                  </button>
                  <div className="flex items-center gap-3 px-1">
                    <Progress value={percent} className="flex-1" />
                    <span className="w-24 shrink-0 text-right text-muted-foreground text-xs tabular-nums">
                      {count} 票 ({Math.round(percent)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <OptionsSkeleton count={poll.options.length} />
        )}

        <div className="flex items-center justify-between text-muted-foreground text-sm">
          <span>
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
      </CardContent>
    </Card>
  );
}

function StatusBanner({
  status,
  youVoted,
}: {
  status: PollStatus;
  youVoted: string | null;
}) {
  if (status === "closed") {
    return (
      <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground text-sm">
        この投票は締め切られました。最終結果をご覧ください。
      </p>
    );
  }
  if (youVoted) {
    return (
      <p className="rounded-md bg-emerald-600/10 px-3 py-2 text-emerald-700 text-sm dark:text-emerald-400">
        投票しました。ご協力ありがとうございます。
      </p>
    );
  }
  return (
    <p className="text-muted-foreground text-sm">
      選択肢をタップして投票してください（変更はできません）。
    </p>
  );
}

function ConnectionBadge({
  connected,
  everConnected,
}: {
  connected: boolean;
  everConnected: boolean;
}) {
  if (connected) {
    return (
      <Badge className="shrink-0 bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950">
        <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-current" />
        ライブ
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="shrink-0">
      <span className="mr-1 inline-block size-1.5 rounded-full bg-current" />
      {everConnected ? "再接続中…" : "接続中…"}
    </Badge>
  );
}

function OptionsSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => `opt-${i}`).map((key) => (
        <div key={key} className="space-y-1.5">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

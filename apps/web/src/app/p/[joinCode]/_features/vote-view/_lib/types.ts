/**
 * Poll DO（PartyServer）の WebSocket メッセージ契約。
 *
 * API レスポンスではなく WS プロトコルのため、ここでローカル定義する
 * （server 側 `realtime/protocol.ts` の ServerMessage と対応）。参加者は
 * 投票するため voted / error も受け取る。
 */

export type PollStatus = "draft" | "open" | "closed";

type OptionView = { id: string; label: string };

export type ServerMessage =
  | {
      type: "state";
      status: PollStatus;
      options: OptionView[];
      tallies: Record<string, number>;
      totalVotes: number;
      participants: number;
      youVoted: string | null;
    }
  | {
      type: "tally";
      tallies: Record<string, number>;
      totalVotes: number;
      participants: number;
    }
  | { type: "status"; status: PollStatus }
  | { type: "voted"; optionId: string }
  | { type: "error"; code: string; message: string };

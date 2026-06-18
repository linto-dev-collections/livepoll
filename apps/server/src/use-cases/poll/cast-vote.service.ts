import {
  AlreadyVotedError,
  InvalidOptionError,
  PollNotFoundError,
  PollNotOpenError,
} from "../../domain/errors/poll.error";
import type { createPollRepository } from "../../infrastructure/repositories/poll.repository";
import type { createVoteRepository } from "../../infrastructure/repositories/vote.repository";

type Deps = {
  pollRepo: ReturnType<typeof createPollRepository>;
  voteRepo: ReturnType<typeof createVoteRepository>;
};

/**
 * 匿名参加者の 1 票を検証・永続化し、最新集計を返す。
 *
 * サーバ権威の検証（クライアント入力を信用しない）：
 *  1. 投票が存在するか
 *  2. status === "open"（締切後・下書きは拒否）
 *  3. optionId が当該投票の選択肢か（別投票の選択肢を弾く）
 *  4. UNIQUE(poll_id, voter_key) による二重投票拒否
 */
export function createCastVoteService(deps: Deps) {
  return {
    async execute(input: {
      pollId: string;
      optionId: string;
      voterKey: string;
    }): Promise<{ tallies: Record<string, number>; totalVotes: number }> {
      const poll = await deps.pollRepo.findByIdWithOptions(input.pollId);
      if (!poll) {
        throw new PollNotFoundError();
      }
      if (poll.status !== "open") {
        throw new PollNotOpenError();
      }
      if (!poll.options.some((option) => option.id === input.optionId)) {
        throw new InvalidOptionError();
      }

      const { inserted } = await deps.voteRepo.create({
        pollId: input.pollId,
        optionId: input.optionId,
        voterKey: input.voterKey,
      });
      if (!inserted) {
        throw new AlreadyVotedError();
      }

      const [tallies, totalVotes] = await Promise.all([
        deps.voteRepo.tally(input.pollId),
        deps.voteRepo.total(input.pollId),
      ]);
      return { tallies, totalVotes };
    },
  };
}

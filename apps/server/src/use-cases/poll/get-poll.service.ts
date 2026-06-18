import { PollNotFoundError } from "../../domain/errors/poll.error";
import type { PollWithOptions } from "../../domain/types/poll";
import type { createPollRepository } from "../../infrastructure/repositories/poll.repository";

type Deps = {
  pollRepo: ReturnType<typeof createPollRepository>;
};

/** 組織スコープ付きで投票を取得する。別組織・不存在は 404（PollNotFoundError）。 */
export function createGetPollService(deps: Deps) {
  return {
    async execute(
      id: string,
      organizationId: string,
    ): Promise<PollWithOptions> {
      const poll = await deps.pollRepo.findByIdForOrg(id, organizationId);
      if (!poll) {
        throw new PollNotFoundError();
      }
      return poll;
    },
  };
}

import { PollNotFoundError } from "../../domain/errors/poll.error";
import type { createPollRepository } from "../../infrastructure/repositories/poll.repository";

type Deps = {
  pollRepo: ReturnType<typeof createPollRepository>;
};

/** 投票を削除する（組織スコープで存在確認後に削除）。 */
export function createDeletePollService(deps: Deps) {
  return {
    async execute(input: {
      id: string;
      organizationId: string;
    }): Promise<void> {
      const existing = await deps.pollRepo.findByIdForOrg(
        input.id,
        input.organizationId,
      );
      if (!existing) {
        throw new PollNotFoundError();
      }
      await deps.pollRepo.delete(input.id);
    },
  };
}

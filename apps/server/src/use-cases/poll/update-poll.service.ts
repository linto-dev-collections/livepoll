import {
  DuplicatePollOptionError,
  PollNotEditableError,
  PollNotFoundError,
} from "../../domain/errors/poll.error";
import type { PollWithOptions } from "../../domain/types/poll";
import type { createPollRepository } from "../../infrastructure/repositories/poll.repository";

type Deps = {
  pollRepo: ReturnType<typeof createPollRepository>;
};

function assertUniqueOptions(options: string[]): void {
  const seen = new Set<string>();
  for (const option of options) {
    if (seen.has(option)) {
      throw new DuplicatePollOptionError();
    }
    seen.add(option);
  }
}

/**
 * 投票内容（question / options）を更新する。
 * draft 状態のみ編集可。それ以外は PollNotEditableError。
 */
export function createUpdatePollService(deps: Deps) {
  return {
    async execute(input: {
      id: string;
      organizationId: string;
      question?: string;
      options?: string[];
    }): Promise<PollWithOptions> {
      const existing = await deps.pollRepo.findByIdForOrg(
        input.id,
        input.organizationId,
      );
      if (!existing) {
        throw new PollNotFoundError();
      }
      if (existing.status !== "draft") {
        throw new PollNotEditableError();
      }
      if (input.options) {
        assertUniqueOptions(input.options);
      }

      await deps.pollRepo.updateContent(input.id, {
        question: input.question,
        options: input.options?.map((label, index) => ({
          label,
          position: index,
        })),
      });

      const updated = await deps.pollRepo.findByIdForOrg(
        input.id,
        input.organizationId,
      );
      if (!updated) {
        throw new PollNotFoundError();
      }
      return updated;
    },
  };
}

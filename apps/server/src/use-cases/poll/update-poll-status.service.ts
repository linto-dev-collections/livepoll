import {
  InvalidStatusTransitionError,
  PollNotFoundError,
} from "../../domain/errors/poll.error";
import type { PollWithOptions } from "../../domain/types/poll";
import type { createPollRepository } from "../../infrastructure/repositories/poll.repository";

type Deps = {
  pollRepo: ReturnType<typeof createPollRepository>;
};

/**
 * 投票の状態を遷移させる（公開: draft→open / 締切: open→closed）。
 * - 同一状態への遷移は冪等（現状をそのまま返す）。
 * - それ以外の遷移（closed→*, *→draft 等）は InvalidStatusTransitionError。
 */
export function createUpdatePollStatusService(deps: Deps) {
  return {
    async execute(input: {
      id: string;
      organizationId: string;
      status: "open" | "closed";
    }): Promise<PollWithOptions> {
      const existing = await deps.pollRepo.findByIdForOrg(
        input.id,
        input.organizationId,
      );
      if (!existing) {
        throw new PollNotFoundError();
      }

      const current = existing.status;
      const next = input.status;

      // 冪等: 既に目的の状態なら何もしない
      if (current === next) {
        return existing;
      }

      if (next === "open") {
        if (current !== "draft") {
          throw new InvalidStatusTransitionError(current, next);
        }
        await deps.pollRepo.updateStatus(input.id, "open", {
          openedAt: new Date(),
        });
      } else {
        // next === "closed"
        if (current !== "open") {
          throw new InvalidStatusTransitionError(current, next);
        }
        await deps.pollRepo.updateStatus(input.id, "closed", {
          closedAt: new Date(),
        });
      }

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

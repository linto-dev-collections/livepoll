import type { Poll } from "../../domain/types/poll";
import type { createPollRepository } from "../../infrastructure/repositories/poll.repository";

type Deps = {
  pollRepo: ReturnType<typeof createPollRepository>;
};

/** active org の投票一覧を返す。 */
export function createListPollsService(deps: Deps) {
  return {
    execute(organizationId: string): Promise<Poll[]> {
      return deps.pollRepo.listByOrg(organizationId);
    },
  };
}

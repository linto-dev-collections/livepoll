import { DuplicatePollOptionError } from "../../domain/errors/poll.error";
import { generateJoinCode } from "../../domain/services/join-code";
import type { PollWithOptions } from "../../domain/types/poll";
import type { createPollRepository } from "../../infrastructure/repositories/poll.repository";

type Deps = {
  pollRepo: ReturnType<typeof createPollRepository>;
};

const MAX_JOIN_CODE_ATTEMPTS = 5;

/**
 * 一意な join_code を生成する。衝突時は最大 5 回までリトライする。
 * 40bit のエントロピーがあるため通常 1 回で確定する。
 */
async function generateUniqueJoinCode(
  pollRepo: Deps["pollRepo"],
): Promise<string> {
  for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt++) {
    const code = generateJoinCode();
    if (!(await pollRepo.existsByJoinCode(code))) {
      return code;
    }
  }
  throw new Error("Failed to generate a unique join code");
}

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
 * 投票を draft 状態で作成する。
 * 選択肢には入力順で position（0 始まり）を採番する。
 */
export function createCreatePollService(deps: Deps) {
  return {
    async execute(input: {
      organizationId: string;
      createdByUserId: string;
      question: string;
      options: string[];
    }): Promise<PollWithOptions> {
      assertUniqueOptions(input.options);
      const joinCode = await generateUniqueJoinCode(deps.pollRepo);
      return deps.pollRepo.create({
        organizationId: input.organizationId,
        createdByUserId: input.createdByUserId,
        question: input.question,
        joinCode,
        options: input.options.map((label, index) => ({
          label,
          position: index,
        })),
      });
    },
  };
}

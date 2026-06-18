import { DomainError } from "./domain.error";

/**
 * 投票が見つからない（または別組織の投票で組織スコープに非該当）。
 * HTTP マッピング: 404 Not Found（apps/server/src/app.ts:onError）。
 * IDOR 防止のため、別組織の投票は「権限なし(403)」ではなく「存在しない(404)」として扱う。
 */
export class PollNotFoundError extends DomainError {
  constructor() {
    super("Poll not found", "NOT_FOUND");
  }
}

/**
 * draft 以外の投票に対して内容編集を試みたとき throw。
 * HTTP マッピング: 400 Validation Error。
 */
export class PollNotEditableError extends DomainError {
  constructor() {
    super("Poll can only be edited while it is a draft", "VALIDATION_ERROR");
  }
}

/**
 * 受付中(open)でない投票に投票しようとしたとき throw（Phase 2 の castVote で使用）。
 * HTTP マッピング: 409 Conflict。
 */
export class PollNotOpenError extends DomainError {
  constructor() {
    super("Poll is not open for voting", "POLL_NOT_OPEN");
  }
}

/**
 * 当該投票に属さない選択肢へ投票しようとしたとき throw（Phase 2 の castVote で使用）。
 * HTTP マッピング: 400 Validation/Invalid Option。
 */
export class InvalidOptionError extends DomainError {
  constructor() {
    super("Invalid option for this poll", "INVALID_OPTION");
  }
}

/**
 * 同一投票内で選択肢文言が重複しているとき throw。
 * HTTP マッピング: 400 Validation Error。
 */
export class DuplicatePollOptionError extends DomainError {
  constructor() {
    super("Poll options must be unique", "VALIDATION_ERROR");
  }
}

/**
 * 同一 voter_key で既に投票済みのとき throw（Phase 2 の castVote で使用）。
 * HTTP マッピング: 409 Conflict。
 */
export class AlreadyVotedError extends DomainError {
  constructor() {
    super("You have already voted in this poll", "ALREADY_VOTED");
  }
}

/**
 * 許可されない状態遷移（例: closed→open、open→draft）を試みたとき throw。
 * 許可される遷移は draft→open、open→closed のみ。
 * HTTP マッピング: 400 Validation Error。
 */
export class InvalidStatusTransitionError extends DomainError {
  constructor(from: PollStatusLike, to: PollStatusLike) {
    super(
      `Cannot change poll status from ${from} to ${to}`,
      "VALIDATION_ERROR",
    );
  }
}

type PollStatusLike = "draft" | "open" | "closed";

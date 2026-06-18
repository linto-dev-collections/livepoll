/**
 * 投票ドメインの型定義。
 * 外部パッケージ依存禁止（dependency-cruiser: domain-no-external-packages）。
 */

export type PollStatus = "draft" | "open" | "closed";

export type Poll = {
  id: string;
  organizationId: string;
  /** 作成者。退会で SET NULL されうるため null 許容。 */
  createdByUserId: string | null;
  question: string;
  status: PollStatus;
  /** 参加用 URL/QR に使う公開コード。 */
  joinCode: string;
  openedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PollOption = {
  id: string;
  pollId: string;
  label: string;
  /** 表示順（0 始まり）。 */
  position: number;
};

export type PollWithOptions = Poll & { options: PollOption[] };

/** 選択肢ごとの得票数。 */
export type PollTally = { optionId: string; count: number }[];

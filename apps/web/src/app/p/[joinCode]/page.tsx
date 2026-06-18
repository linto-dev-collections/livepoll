import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VoteContainer } from "./_containers/vote-container";
import { getPublicPoll } from "./_lib/queries";

export const metadata: Metadata = {
  title: "投票",
  // 公開参加ページは検索インデックス不要。
  robots: { index: false, follow: false },
};

export default async function PublicPollPage({
  params,
}: PageProps<"/p/[joinCode]">) {
  const { joinCode } = await params;
  const result = await getPublicPoll(joinCode);

  // 不存在・draft（未公開）は存在を秘匿して 404。
  if (!result.success) {
    notFound();
  }

  return <VoteContainer poll={result.data} />;
}

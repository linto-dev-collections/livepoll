import { PageHeader } from "@/components/page-header";
import { PollDetailContainer } from "./_containers/poll-detail-container";

export default async function PollDetailPage({
  params,
}: PageProps<"/dashboard/polls/[id]">) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        items={[{ label: "投票", href: "/dashboard/polls" }, { label: "詳細" }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <PollDetailContainer id={id} />
      </div>
    </>
  );
}

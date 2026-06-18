import { PageHeader } from "@/components/page-header";
import { CreatePollContainer } from "./_containers/create-poll-container";

export default function NewPollPage() {
  return (
    <>
      <PageHeader
        items={[{ label: "投票", href: "/dashboard/polls" }, { label: "作成" }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <CreatePollContainer />
      </div>
    </>
  );
}

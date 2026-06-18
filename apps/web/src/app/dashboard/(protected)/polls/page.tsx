import { PageHeader } from "@/components/page-header";
import { PollsContainer } from "./_containers/polls-container";

export default function PollsPage() {
  return (
    <>
      <PageHeader items={[{ label: "投票" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <PollsContainer />
      </div>
    </>
  );
}

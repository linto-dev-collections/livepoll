import { PollsView } from "../_features/polls-view";
import { listPolls } from "../_lib/queries";

export async function PollsContainer() {
  const result = await listPolls();

  if (!result.success) {
    return <p className="text-muted-foreground text-sm">{result.error}</p>;
  }

  return <PollsView polls={result.data} />;
}

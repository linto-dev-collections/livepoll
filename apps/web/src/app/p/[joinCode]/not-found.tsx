import { SearchXIcon } from "lucide-react";

export default function PollNotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <SearchXIcon className="size-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="font-semibold text-xl">投票が見つかりません</h1>
        <p className="text-muted-foreground text-sm">
          URL が正しいか、投票が公開中かをご確認ください。
        </p>
      </div>
    </main>
  );
}

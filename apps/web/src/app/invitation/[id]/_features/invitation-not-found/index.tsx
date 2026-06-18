import { buttonVariants } from "@livepoll/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@livepoll/ui/components/ui/card";
import Link from "next/link";

/**
 * 招待が見つからない / 期限切れ / 取り消された / 組織が消滅した場合の汎用 UI。
 *
 * Better Auth は誰が・どの組織宛の招待だったかを返さないので、文言もぼかす
 * (招待の存在を不一致セッションから探られないようにする情報非開示と整合)。
 */
export function InvitationNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>招待を表示できません</CardTitle>
          <CardDescription>
            この招待は見つかりませんでした。すでに承認・取り消し済みか、有効期限が切れている可能性があります。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            お心当たりがある場合は、招待を送ったメンバーに連絡して、もう一度招待を送ってもらってください。
          </p>
        </CardContent>
        <CardFooter>
          <Link
            href="/dashboard"
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            ダッシュボードへ戻る
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

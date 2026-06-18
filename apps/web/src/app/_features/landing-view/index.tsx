"use client";

import { buttonVariants } from "@livepoll/ui/components/ui/button";
import Link from "next/link";
import { LivepollIcon, SiteFooter, SiteHeader } from "../site-chrome";

export function LandingView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-32 text-center">
        <LivepollIcon className="size-16 md:size-20" />
        <div className="flex flex-col items-center gap-4">
          <h1 className="max-w-2xl font-bold text-4xl tracking-tight md:text-5xl">
            livepoll
          </h1>
          <p className="max-w-md text-balance text-muted-foreground md:text-lg">
            チームでアカウントと組織を管理するためのプラットフォーム。
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className={buttonVariants({ size: "lg", className: "min-w-44" })}
          >
            無料で始める
          </Link>
          <Link
            href="/sign-in"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className: "min-w-44",
            })}
          >
            ログイン
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

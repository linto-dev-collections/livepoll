import { env } from "@livepoll/env/web";
import { type ApiResult, handleApiResponse } from "@/lib/handle-api-response";
import type { PublicPoll } from "./types";

/**
 * 公開スナップショットを取得する（認証不要）。
 *
 * 参加ページは Cookie 不要のため、認証ヘッダを付けない素の fetch で公開 API を
 * 直接叩く（createServerApi の cookie 転送は使わない）。draft / 不存在は API が
 * 404 を返すため、呼び出し側で notFound() に変換する。
 */
export async function getPublicPoll(
  joinCode: string,
): Promise<ApiResult<PublicPoll>> {
  const res = await fetch(
    `${env.NEXT_PUBLIC_SERVER_URL}/api/public/polls/${encodeURIComponent(joinCode)}`,
    { cache: "no-store" },
  );
  return handleApiResponse<PublicPoll>(res);
}

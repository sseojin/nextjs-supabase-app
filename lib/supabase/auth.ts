import { createServerClient } from "@supabase/ssr";

/**
 * Authorization 헤더 토큰으로 Supabase 클라이언트 생성
 * API 라우트에서 Bearer 토큰을 사용하여 인증할 때 사용
 */
export function createClientWithAuth(accessToken: string) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
      global: {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      },
    },
  );
}

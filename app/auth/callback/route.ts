import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

/**
 * OAuth 콜백 라우트
 *
 * 목적: Google OAuth 로그인 완료 후 인증 코드를 세션으로 교환
 *
 * 작동 흐름:
 * 1. Google에서 사용자를 리다이렉트할 때 code 파라미터 포함
 * 2. code를 exchangeCodeForSession()으로 세션으로 교환
 * 3. 성공 시 next 파라미터의 경로로 리다이렉트 (기본값: /protected)
 * 4. 실패 시 /auth/error 페이지로 리다이렉트
 *
 * PKCE 플로우:
 * - code_verifier: localStorage에 저장됨 (signInWithOAuth 호출 시 자동 생성)
 * - exchangeCodeForSession()이 자동으로 code와 code_verifier 검증
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/protected";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // OAuth 제공자가 에러를 반환한 경우 (사용자가 권한 거부, 설정 오류 등)
  if (error) {
    console.error("[OAuth Callback] 제공자 에러:", error, errorDescription);

    // 한국어 에러 메시지 매핑
    const errorMessages: Record<string, string> = {
      access_denied: "로그인 권한이 거부되었습니다. 다시 시도해주세요.",
      server_error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      temporarily_unavailable: "서비스가 일시적으로 이용 불가능합니다.",
    };

    const koreanError =
      errorMessages[error] || errorDescription || "로그인 중 오류가 발생했습니다.";

    redirect(`/auth/error?error=${encodeURIComponent(koreanError)}`);
  }

  // code가 없는 경우 (잘못된 요청)
  if (!code) {
    console.error("[OAuth Callback] Authorization code가 없습니다.");
    redirect("/auth/error?error=인증 코드가 없습니다.");
  }

  // Server Client 생성
  const supabase = await createClient();

  // Authorization Code를 세션으로 교환
  // PKCE 검증: exchangeCodeForSession()이 자동으로 localStorage의 code_verifier 사용
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[OAuth Callback] Code 교환 실패:", exchangeError.message);
    redirect(`/auth/error?error=${encodeURIComponent("로그인 처리 중 오류가 발생했습니다.")}`);
  }

  // 성공: next 파라미터의 경로로 리다이렉트
  // middleware (proxy.ts)가 자동으로 쿠키에 세션 저장
  console.log("[OAuth Callback] 성공, 리다이렉트:", next);
  redirect(next);
}

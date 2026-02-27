import { createClient } from "@supabase/supabase-js";

/**
 * Service Role Key를 사용한 Supabase Admin 클라이언트
 * RLS 정책을 무시하고 서버에서만 사용
 *
 * 사용 예시:
 * - 공유 링크로 프로젝트 조회 (미로그인 사용자도 접근)
 * - 시스템 레벨의 쿼리 실행
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase URL 또는 Service Role Key가 설정되지 않았습니다.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

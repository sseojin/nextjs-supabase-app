import { createClient } from "@supabase/supabase-js";

/**
 * Service Role 키를 사용하는 Supabase Admin 클라이언트
 * RLS를 우회하여 모든 데이터에 접근 가능합니다.
 *
 * ⚠️ 주의: 서버 측 API route에서만 사용해야 합니다!
 * 클라이언트 측에서는 절대 사용하지 마세요!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL 또는 Service Role Key가 설정되지 않았습니다.");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

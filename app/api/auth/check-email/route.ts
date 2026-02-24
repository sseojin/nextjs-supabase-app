/**
 * 이메일 중복 확인 API 엔드포인트
 *
 * POST /api/auth/check-email
 * Body: { email: string }
 *
 * 응답:
 * - 성공 (중복 없음): { success: true, exists: false }
 * - 중복 존재: { success: false, exists: true, error: "이미 가입된 이메일입니다." }
 * - 에러: { success: false, error: "에러 메시지" }
 */

export async function POST(request: Request) {
  try {
    // 1단계: 요청 본문에서 이메일 추출
    const body = await request.json();
    const { email } = body as { email?: string };

    // 2단계: 이메일 유효성 검사
    if (!email || typeof email !== "string") {
      return Response.json({ success: false, error: "이메일이 필요합니다." }, { status: 400 });
    }

    // 3단계: 이메일 형식 검증 (기본 확인)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { success: false, error: "유효하지 않은 이메일 형식입니다." },
        { status: 400 },
      );
    }

    // 4단계: Supabase REST API를 사용하여 사용자 조회
    // Service Role Key로 auth.users에서 이메일로 검색
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase 환경변수가 설정되지 않았습니다.");
      return Response.json({ success: false, error: "서버 설정 오류입니다." }, { status: 500 });
    }

    // 5단계: Supabase auth.users 테이블에서 이메일로 사용자 검색
    const response = await fetch(
      `${supabaseUrl}/rest/v1/auth.users?email=eq.${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    );

    // 응답 파싱
    const data = (await response.json()) as unknown[];

    // 6단계: 결과 처리
    // 배열이 비어있으면 이메일이 존재하지 않음
    if (!Array.isArray(data) || data.length === 0) {
      return Response.json({ success: true, exists: false }, { status: 200 });
    }

    // 이메일이 이미 존재하면 중복 에러 반환
    return Response.json(
      {
        success: false,
        exists: true,
        error: "이미 가입된 이메일입니다. 다른 이메일을 사용하거나 로그인을 시도해주세요.",
      },
      { status: 400 },
    );
  } catch (error) {
    // 예상치 못한 에러 처리
    console.error("이메일 확인 API 오류:", error);
    return Response.json(
      {
        success: false,
        error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 },
    );
  }
}

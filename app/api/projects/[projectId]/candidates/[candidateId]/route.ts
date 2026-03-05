import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { deleteCandidate } from "@/lib/supabase/candidates";

/**
 * DELETE /api/projects/[projectId]/candidates/[candidateId]
 * 후보지를 삭제합니다.
 * 후보지를 생성한 사용자 또는 모든 프로젝트 멤버가 삭제 가능합니다.
 *
 * 응답:
 * - 200: { success: true }
 * - 401: 미인증
 * - 404: 후보지 없음
 * - 500: 서버 에러
 */
export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string; candidateId: string } },
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "인증이 필요합니다." }), {
        status: 401,
      });
    }

    // 후보지 삭제 (RLS 정책에 의해 권한이 자동 확인됨)
    await deleteCandidate(params.candidateId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("후보지 삭제 실패:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";

    // 권한 오류인 경우
    if (message.includes("새로운 행을 위반") || message.includes("정책")) {
      return new Response(JSON.stringify({ error: "삭제 권한이 없습니다." }), {
        status: 403,
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}

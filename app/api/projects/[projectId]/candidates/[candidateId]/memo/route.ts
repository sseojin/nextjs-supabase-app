import { updateCandidateMemo } from "@/lib/supabase/candidates";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/projects/[projectId]/candidates/[candidateId]/memo
 * 후보지의 메모를 수정합니다.
 *
 * 요청 본문:
 * {
 *   "memo": "수정할 메모 내용" (최대 200자, null이면 메모 삭제)
 * }
 *
 * 응답:
 * - 200: { memo: string | null } (수정된 메모)
 * - 400: 유효성 검사 실패
 * - 401: 미인증
 * - 403: 권한 없음
 * - 500: 서버 에러
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; candidateId: string }> },
) {
  try {
    const { projectId, candidateId } = await params;

    // 1단계: 인증 확인 (쿠키 기반 세션)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "인증이 필요합니다. 다시 로그인해주세요." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2단계: 요청 본문 파싱
    const body = await request.json();

    // 3단계: 유효성 검사
    if (body.memo === undefined) {
      return new Response(
        JSON.stringify({
          error: "메모 내용이 누락되었습니다.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 메모 길이 검사 (최대 200자)
    if (body.memo !== null && body.memo.length > 200) {
      return new Response(
        JSON.stringify({
          error: "메모는 최대 200자까지 입력할 수 있습니다.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 4단계: 권한 확인 (프로젝트 멤버인지 확인)
    const { data: membership, error: membershipError } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[PATCH /candidates/memo] 멤버십 확인 에러:", membershipError);
      return new Response(JSON.stringify({ error: "권한 확인 중 오류가 발생했습니다." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!membership) {
      return new Response(JSON.stringify({ error: "프로젝트 멤버만 메모를 수정할 수 있습니다." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5단계: 후보지가 해당 프로젝트에 속하는지 확인
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, project_id")
      .eq("id", candidateId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (candidateError) {
      console.error("[PATCH /candidates/memo] 후보지 조회 에러:", candidateError);
      return new Response(JSON.stringify({ error: "후보지 조회 중 오류가 발생했습니다." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!candidate) {
      return new Response(JSON.stringify({ error: "후보지를 찾을 수 없습니다." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6단계: 메모 업데이트 (RLS 정책이 자동으로 권한 확인)
    const updatedMemo = await updateCandidateMemo(candidateId, body.memo === "" ? null : body.memo);

    return new Response(JSON.stringify({ memo: updatedMemo }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PATCH /candidates/memo] 메모 수정 실패:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import {
  voteCandidate,
  getFinalLocations,
  createFinalLocation,
  deleteFinalLocation,
} from "@/lib/supabase/candidates";

/**
 * POST /api/projects/[projectId]/candidates/[candidateId]/vote
 * 후보지에 투표합니다. (투표 생성, 변경, 취소)
 *
 * 요청 본문:
 * {
 *   "vote_type": "agree" | "disagree" | null
 * }
 *
 * vote_type이 null인 경우 투표를 취소합니다.
 * 기존 투표와 동일한 유형으로 다시 투표하면 취소됩니다.
 *
 * 응답:
 * - 200: {
 *     "candidate": {
 *       "id": "uuid",
 *       "votes_agree": 2,
 *       "votes_disagree": 1,
 *       "user_vote": "agree" | "disagree" | null,
 *       "agreement_ratio": 66.7
 *     }
 *   }
 * - 400: 유효성 검사 실패
 * - 401: 미인증
 * - 500: 서버 에러
 */
export async function POST(
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

    // 요청 본문 파싱
    const body = await request.json();

    // 유효성 검사
    if (body.vote_type !== null && !["agree", "disagree"].includes(body.vote_type)) {
      return new Response(
        JSON.stringify({
          error: "vote_type은 'agree', 'disagree', 또는 null이어야 합니다.",
        }),
        { status: 400 },
      );
    }

    // 투표 처리
    const voteResult = await voteCandidate(params.candidateId, user.id, body.vote_type);

    // 찬성 비율 66% 이상 확인 -> 최종 장소로 자동 저장
    if (voteResult.agreement_ratio >= 66) {
      try {
        // 이미 저장된 최종 장소인지 확인
        const finalLocations = await getFinalLocations(params.projectId);
        const isAlreadySaved = finalLocations.some((fl) => fl.candidate_id === params.candidateId);

        if (!isAlreadySaved) {
          await createFinalLocation(params.projectId, params.candidateId);
        }
      } catch (error) {
        // 최종 장소 저장 실패는 로깅만 하고 투표 결과는 반환
        console.error("최종 장소 자동 저장 실패:", error);
      }
    } else {
      // 찬성 < 66% -> 최종 장소에서 제거
      try {
        await deleteFinalLocation(params.candidateId);
      } catch (error) {
        // 최종 장소 삭제는 실패해도 무시 (이미 없을 수 있음)
        console.error("최종 장소 삭제 실패:", error);
      }
    }

    return new Response(
      JSON.stringify({
        candidate: voteResult,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("투표 처리 실패:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}

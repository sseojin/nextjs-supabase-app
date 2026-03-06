import {
  getFinalLocations,
  createFinalLocation,
  deleteFinalLocation,
} from "@/lib/supabase/candidates";

/**
 * JWT 토큰에서 사용자 ID 추출
 */
function extractUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    return decodedPayload.sub || null;
  } catch {
    return null;
  }
}

/**
 * 요청에서 사용자 ID 추출
 */
function getUserIdFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return extractUserIdFromToken(token);
  }

  return null;
}

/**
 * GET /api/projects/[projectId]/final-locations
 * 최종 선정된 장소 목록을 조회합니다. (찬성 >= 66%)
 *
 * 응답:
 * - 200: FinalLocation[] (최종 장소 배열)
 * - 401: 미인증
 * - 500: 서버 에러
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;

    // Authorization 헤더에서 사용자 ID 추출 (인증 확인만 함)
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return new Response(JSON.stringify({ error: "인증이 필요합니다." }), {
        status: 401,
      });
    }

    // 최종 장소 조회
    const finalLocations = await getFinalLocations(projectId);

    return new Response(JSON.stringify({ final_locations: finalLocations }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /final-locations] 최종 장소 조회 실패:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}

/**
 * POST /api/projects/[projectId]/final-locations
 * 최종 장소를 명시적으로 저장합니다.
 * (일반적으로 투표 시 자동으로 저장되지만, 수동 저장도 지원)
 *
 * 요청 본문:
 * {
 *   "candidate_id": "uuid"
 * }
 *
 * 응답:
 * - 201: FinalLocation (저장된 최종 장소)
 * - 400: 유효성 검사 실패 또는 66% 미만
 * - 401: 미인증
 * - 500: 서버 에러
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;

    // Authorization 헤더에서 사용자 ID 추출 (인증 확인만 함)
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return new Response(JSON.stringify({ error: "인증이 필요합니다." }), {
        status: 401,
      });
    }

    // 요청 본문 파싱
    const body = await request.json();

    // 유효성 검사
    if (!body.candidate_id) {
      return new Response(JSON.stringify({ error: "candidate_id가 누락되었습니다." }), {
        status: 400,
      });
    }

    // 최종 장소 저장
    const finalLocation = await createFinalLocation(projectId, body.candidate_id);

    return new Response(JSON.stringify(finalLocation), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[POST /final-locations] 최종 장소 저장 실패:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";

    // 66% 미만 오류
    if (message.includes("66%")) {
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}

/**
 * DELETE /api/projects/[projectId]/final-locations
 * 최종 장소를 삭제합니다. (투표 결과가 66% 미만으로 떨어졌을 때 자동 호출)
 *
 * 쿼리 파라미터:
 * - candidate_id: 삭제할 후보지 ID (필수)
 *
 * 응답:
 * - 200: { success: true }
 * - 400: 유효성 검사 실패
 * - 401: 미인증
 * - 500: 서버 에러
 */
export async function DELETE(request: Request) {
  try {
    // Authorization 헤더에서 사용자 ID 추출 (인증 확인만 함)
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return new Response(JSON.stringify({ error: "인증이 필요합니다." }), {
        status: 401,
      });
    }

    // 쿼리 파라미터에서 candidate_id 추출
    const url = new URL(request.url);
    const candidateId = url.searchParams.get("candidate_id");

    if (!candidateId) {
      return new Response(JSON.stringify({ error: "candidate_id 쿼리 파라미터가 필요합니다." }), {
        status: 400,
      });
    }

    // 최종 장소 삭제
    await deleteFinalLocation(candidateId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[DELETE /final-locations] 최종 장소 삭제 실패:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}

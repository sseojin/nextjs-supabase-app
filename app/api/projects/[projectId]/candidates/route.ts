import { getCandidates, createCandidate } from "@/lib/supabase/candidates";

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
 * GET /api/projects/[projectId]/candidates
 * 프로젝트의 모든 후보지를 조회합니다. (사용자 투표 정보 포함)
 *
 * 응답:
 * - 200: CandidateWithUserVote[] (후보지 배열)
 * - 401: 미인증
 * - 404: 프로젝트 없음
 * - 500: 서버 에러
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;

    // Authorization 헤더에서 사용자 ID 추출
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return new Response(JSON.stringify({ error: "인증이 필요합니다." }), {
        status: 401,
      });
    }

    // getCandidates 함수를 사용하여 후보지 조회
    const candidates = await getCandidates(projectId, userId);

    return new Response(JSON.stringify(candidates), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[GET /candidates] 후보지 조회 실패:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}

/**
 * POST /api/projects/[projectId]/candidates
 * 프로젝트에 새로운 후보지를 추가합니다.
 *
 * 요청 본문:
 * {
 *   "location_name": "장소명",
 *   "address": "주소",
 *   "category": "카테고리",
 *   "lat": 37.123,
 *   "lng": 127.123
 * }
 *
 * 응답:
 * - 201: Candidate (생성된 후보지)
 * - 400: 유효성 검사 실패
 * - 401: 미인증
 * - 500: 서버 에러
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;

    // Authorization 헤더에서 사용자 ID 추출
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return new Response(JSON.stringify({ error: "인증이 필요합니다." }), {
        status: 401,
      });
    }

    // 요청 본문 파싱
    const body = await request.json();

    // 유효성 검사
    if (!body.location_name || !body.address || body.lat === undefined || body.lng === undefined) {
      return new Response(
        JSON.stringify({
          error: "필수 필드(location_name, address, lat, lng)가 누락되었습니다.",
        }),
        { status: 400 },
      );
    }

    // 중복 체크: 같은 프로젝트에 이미 동일한 장소명이 있는지 확인
    const existingCandidates = await getCandidates(projectId, userId);
    const isDuplicate = existingCandidates.some((c) => c.location_name === body.location_name);

    if (isDuplicate) {
      return new Response(
        JSON.stringify({
          error: "이미 후보지로 등록되었습니다.",
        }),
        { status: 400 },
      );
    }

    // 후보지 생성
    const candidate = await createCandidate(
      projectId,
      {
        location_name: body.location_name,
        address: body.address,
        category: body.category,
        lat: parseFloat(body.lat),
        lng: parseFloat(body.lng),
        memo: body.memo,
      },
      userId,
    );

    return new Response(JSON.stringify(candidate), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[POST /candidates] 후보지 등록 실패:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}

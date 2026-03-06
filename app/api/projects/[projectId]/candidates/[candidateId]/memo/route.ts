import { createClient } from "@/lib/supabase/server";

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
 * PATCH /api/projects/[projectId]/candidates/[candidateId]/memo
 * 후보지의 메모를 수정합니다.
 *
 * 요청 본문:
 * {
 *   "memo": "수정할 메모 내용" (최대 200자)
 * }
 *
 * 응답:
 * - 200: { memo: string } (수정된 메모)
 * - 400: 유효성 검사 실패
 * - 401: 미인증
 * - 500: 서버 에러
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; candidateId: string }> },
) {
  try {
    const { candidateId } = await params;

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
    if (body.memo === undefined) {
      return new Response(
        JSON.stringify({
          error: "메모 내용이 누락되었습니다.",
        }),
        { status: 400 },
      );
    }

    // 메모 길이 검사 (최대 200자)
    if (body.memo && body.memo.length > 200) {
      return new Response(
        JSON.stringify({
          error: "메모는 최대 200자까지 입력할 수 있습니다.",
        }),
        { status: 400 },
      );
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient();

    // 메모 업데이트
    const { data, error } = await supabase
      .from("candidates")
      .update({ memo: body.memo || null })
      .eq("id", candidateId)
      .select("memo")
      .single();

    if (error) {
      throw new Error(`메모 수정 실패: ${error.message}`);
    }

    return new Response(JSON.stringify({ memo: data?.memo || null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PATCH /candidates/memo] 메모 수정 실패:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}

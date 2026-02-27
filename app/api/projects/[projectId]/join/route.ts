import { createClient } from '@/lib/supabase/server';
import { joinProject } from '@/lib/supabase/queries/projects';

/**
 * JWT 토큰에서 사용자 ID 추출
 */
function extractUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decodedPayload = JSON.parse(
      Buffer.from(payload, 'base64').toString('utf-8')
    );
    return decodedPayload.sub || null;
  } catch {
    return null;
  }
}

/**
 * POST /api/projects/[projectId]/join
 * 사용자가 공유 링크를 통해 프로젝트에 참여합니다.
 *
 * 요청 본문:
 * {
 *   shareLink: string (필수, 10자 공유 링크)
 * }
 *
 * 응답:
 * - 201: ProjectMember (멤버 정보)
 * - 400: 유효성 검사 실패
 * - 401: 미인증
 * - 409: 멤버 수 제한 또는 중복 참여
 * - 500: 서버 에러
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // 프로젝트 ID 유효성 검증
    if (!projectId || typeof projectId !== 'string') {
      return Response.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { shareLink } = body;

    // shareLink 유효성 검증
    if (!shareLink || typeof shareLink !== 'string') {
      return Response.json(
        { error: '공유 링크는 필수입니다.' },
        { status: 400 }
      );
    }

    if (shareLink.length !== 10) {
      return Response.json(
        { error: '공유 링크가 유효하지 않습니다.' },
        { status: 400 }
      );
    }

    // 인증 확인 (쿠키 또는 Authorization 헤더)
    const authHeader = request.headers.get('authorization');
    let userId: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Authorization 헤더에서 사용자 ID 추출
      const token = authHeader.slice(7);
      userId = extractUserIdFromToken(token) || undefined;
    } else {
      // 쿠키 기반 인증
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    if (!userId) {
      return Response.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // joinProject 쿼리 호출
    const newMember = await joinProject(projectId, userId);

    return Response.json(newMember, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[projectId]/join 에러:', error);

    const errorMessage = error instanceof Error ? error.message : '참여에 실패했습니다.';

    // 에러 메시지별로 적절한 상태 코드 반환
    if (errorMessage.includes('최대 2명')) {
      return Response.json(
        { error: errorMessage },
        { status: 409 }
      );
    }

    if (errorMessage.includes('이미 참여한')) {
      return Response.json(
        { error: errorMessage },
        { status: 409 }
      );
    }

    if (errorMessage.includes('찾을 수 없습니다')) {
      return Response.json(
        { error: errorMessage },
        { status: 404 }
      );
    }

    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

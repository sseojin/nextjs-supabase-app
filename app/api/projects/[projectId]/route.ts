import { createClient } from '@/lib/supabase/server';
import { getProjectById, deleteProject } from '@/lib/supabase/queries/projects';

/**
 * JWT 토큰에서 사용자 ID 추출
 */
function extractUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    return decodedPayload.sub || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/projects/[projectId]
 * 프로젝트 상세 정보와 멤버 목록을 조회합니다.
 *
 * 경로 파라미터:
 * - projectId: 프로젝트 ID (UUID)
 *
 * 응답:
 * - 200: ProjectWithMembers (프로젝트 + 멤버 목록)
 * - 401: 미인증
 * - 404: 프로젝트를 찾을 수 없음
 * - 500: 서버 에러
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // 프로젝트 ID 유효성 검사
    if (!projectId || typeof projectId !== 'string') {
      return Response.json(
        { error: '프로젝트 ID는 필수입니다.' },
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

    // 프로젝트 상세 조회
    const project = await getProjectById(projectId, userId);

    return Response.json(project, { status: 200 });
  } catch (error) {
    console.error('GET /api/projects/[projectId] 에러:', error);
    const errorMessage = error instanceof Error ? error.message : '프로젝트 조회에 실패했습니다.';

    // 프로젝트를 찾을 수 없는 경우 404 응답
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

/**
 * DELETE /api/projects/[projectId]
 * 프로젝트를 삭제합니다.
 * creator만 삭제할 수 있습니다.
 *
 * 경로 파라미터:
 * - projectId: 프로젝트 ID (UUID)
 *
 * 응답:
 * - 200: { success: true }
 * - 401: 미인증
 * - 403: 권한 없음 (creator가 아님)
 * - 404: 프로젝트를 찾을 수 없음
 * - 500: 서버 에러
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // 프로젝트 ID 유효성 검사
    if (!projectId || typeof projectId !== 'string') {
      return Response.json(
        { error: '프로젝트 ID는 필수입니다.' },
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

    // 프로젝트 존재 여부 및 권한 확인
    try {
      const project = await getProjectById(projectId, userId);

      // creator만 삭제 가능
      if (project.role !== 'creator') {
        return Response.json(
          { error: '프로젝트는 생성자만 삭제할 수 있습니다.' },
          { status: 403 }
        );
      }
    } catch (checkError) {
      const checkErrorMessage =
        checkError instanceof Error ? checkError.message : '프로젝트 조회에 실패했습니다.';

      // 프로젝트를 찾을 수 없음
      if (checkErrorMessage.includes('찾을 수 없습니다')) {
        return Response.json(
          { error: checkErrorMessage },
          { status: 404 }
        );
      }

      throw checkError;
    }

    // 권한 확인 후 삭제
    await deleteProject(projectId, userId);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/projects/[projectId] 에러:', error);
    const errorMessage = error instanceof Error ? error.message : '프로젝트 삭제에 실패했습니다.';

    // 권한 없음 (creator가 아님)
    if (errorMessage.includes('생성자만')) {
      return Response.json(
        { error: errorMessage },
        { status: 403 }
      );
    }

    // 프로젝트를 찾을 수 없음
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

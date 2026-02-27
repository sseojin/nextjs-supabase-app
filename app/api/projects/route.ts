import { createClient } from '@/lib/supabase/server';
import { getProjectsByMonth, createProject } from '@/lib/supabase/queries/projects';
import { generateShareLink } from '@/lib/utils/shareLink';

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
 * 인증 클라이언트 생성 (쿠키 또는 Authorization 헤더)
 */
async function getAuthenticatedClient(request: Request) {
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Authorization 헤더가 있으면 해당 토큰 사용
    const token = authHeader.slice(7); // 'Bearer ' 제거
    return createClientWithAuth(token);
  }

  // 아니면 쿠키 기반 클라이언트 사용
  return await createClient();
}

/**
 * 요청에서 사용자 ID 추출
 */
function getUserIdFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return extractUserIdFromToken(token);
  }

  return null;
}

/**
 * GET /api/projects
 * 사용자가 참여한 프로젝트를 월별로 조회합니다.
 *
 * 쿼리 파라미터:
 * - year: 조회 연도 (필수, 예: 2024)
 * - month: 조회 월 (필수, 1~12)
 *
 * 응답:
 * - 200: Project[] (프로젝트 배열)
 * - 400: 유효성 검사 실패
 * - 401: 미인증
 * - 500: 서버 에러
 */
export async function GET(request: Request) {
  try {
    // 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // 유효성 검사
    if (!year || !month) {
      return Response.json(
        { error: '연도(year)와 월(month)은 필수입니다.' },
        { status: 400 }
      );
    }

    const yearNum = Number(year);
    const monthNum = Number(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return Response.json(
        { error: '유효한 연도와 월을 입력하세요. (month: 1~12)' },
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

    // 프로젝트 조회
    const projects = await getProjectsByMonth(yearNum, monthNum, userId);

    return Response.json(projects, { status: 200 });
  } catch (error) {
    console.error('GET /api/projects 에러:', error);
    const errorMessage = error instanceof Error ? error.message : '프로젝트 조회에 실패했습니다.';
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * 새로운 프로젝트를 생성합니다.
 *
 * 요청 본문:
 * {
 *   title: string (필수, 최소 2자)
 *   date: string (필수, ISO 8601 형식 또는 YYYY-MM-DD)
 *   location?: string (선택사항, 프로젝트 장소)
 * }
 *
 * 응답:
 * - 201: Project (생성된 프로젝트)
 * - 400: 유효성 검사 실패
 * - 401: 미인증
 * - 500: 서버 에러
 */
export async function POST(request: Request) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    const { title, date, location } = body;

    // 유효성 검사
    if (!title || typeof title !== 'string') {
      return Response.json(
        { error: '프로젝트 제목은 필수입니다.' },
        { status: 400 }
      );
    }

    if (title.trim().length < 2) {
      return Response.json(
        { error: '프로젝트 제목은 최소 2자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    if (!date || typeof date !== 'string') {
      return Response.json(
        { error: '프로젝트 날짜는 필수입니다.' },
        { status: 400 }
      );
    }

    // 날짜 파싱
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return Response.json(
        { error: '유효한 날짜를 입력하세요. (ISO 8601 또는 YYYY-MM-DD)' },
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

    // 공유 링크 생성 (nanoid 10자)
    const shareLink = generateShareLink();

    // 프로젝트 생성
    const project = await createProject(title, dateObj, userId, shareLink, location);

    return Response.json(project, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects 에러:', error);
    const errorMessage = error instanceof Error ? error.message : '프로젝트 생성에 실패했습니다.';
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

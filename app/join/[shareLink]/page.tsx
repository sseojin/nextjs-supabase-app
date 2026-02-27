import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProjectByShareLink } from '@/lib/supabase/queries/projects';
import JoinProjectClient from '@/components/projects/JoinProjectClient';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface JoinPageProps {
  params: Promise<{
    shareLink: string;
  }>;
}

/**
 * 공유 링크를 통한 프로젝트 참여 페이지
 *
 * 기능:
 * - shareLink로 프로젝트 정보 조회
 * - 프로젝트 정보 표시 (초대자, 날짜, 장소, 멤버 수)
 * - 미로그인 사용자도 프로젝트 정보 볼 수 있음
 * - JoinProjectClient 컴포넌트에서 참여 로직 처리
 */
export default async function JoinPage({ params }: JoinPageProps) {
  const { shareLink } = await params;

  try {
    // 공유 링크로 프로젝트 조회
    const project = await getProjectByShareLink(shareLink);

    // 프로젝트 멤버 수 조회 (creator 포함)
    // 미로그인 사용자도 접근 가능하도록, 멤버 조회 실패 시 1로 기본값 설정
    let memberCount = 1;
    try {
      const supabase = await createClient();
      const { data: members, error: membersError } = await supabase
        .from('project_members')
        .select('id, user_id, role')
        .eq('project_id', project.id);

      if (!membersError && members) {
        memberCount = members.length;
      }
    } catch (error) {
      // RLS 정책으로 인한 에러는 무시하고 기본값(1) 사용
      console.error('멤버 조회 무시됨:', error);
    }
    const maxMembers = 2;

    // 초대자 정보 (creator 이름은 user 테이블에서 조회 필요하지만, 현재는 ID만 표시)
    const creatorId = project.creator_id;

    // 날짜 포맷팅
    const formattedDate = format(project.date, 'yyyy.MM.dd (EEE)', {
      locale: ko,
    });

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 md:p-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {project.title}
            </h1>
            <p className="text-sm text-gray-600">
              데이트 신청!
            </p>
          </div>

          {/* 프로젝트 정보 섹션 */}
          <div className="space-y-4 mb-8 bg-gray-50 rounded-lg p-5">
            {/* 날짜 */}
            <div className="flex items-start gap-3">
              <span className="text-lg">📆</span>
              <div className="flex-1">
                <p className="text-xs text-gray-600 font-semibold mb-1">
                  날짜
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* 장소 */}
            {project.location && (
              <div className="flex items-start gap-3">
                <span className="text-lg">📍</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-semibold mb-1">
                    장소
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {project.location}
                  </p>
                </div>
              </div>
            )}

            {/* 초대자 */}
            {creatorId && (
              <div className="flex items-start gap-3">
                <span className="text-lg">👤</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-semibold mb-1">
                    초대자
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {creatorId.substring(0, 8)}...
                  </p>
                </div>
              </div>
            )}

            {/* 멤버 현황 */}
            <div className="flex items-start gap-3">
              <span className="text-lg">👥</span>
              <div className="flex-1">
                <p className="text-xs text-gray-600 font-semibold mb-1">
                  참여 현황
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {memberCount}/{maxMembers}명
                </p>
              </div>
            </div>
          </div>

          {/* 참여 컴포넌트 */}
          <JoinProjectClient projectId={project.id} shareLink={shareLink} />

          {/* 안내 문구 */}
          <p className="text-xs text-gray-500 text-center mt-6">
            참여하기 버튼을 눌러 함께 일정을 짜보세요.
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('참여 페이지 에러:', error);
    console.error('에러 상세:', {
      message: error instanceof Error ? error.message : '알 수 없는 에러',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 공유 링크를 찾을 수 없으면 404
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('찾을 수 없습니다')) {
      notFound();
    }

    // 기타 에러는 에러 페이지 표시 (에러 throw 대신)
    // 로그를 통해 디버깅할 수 있도록 함
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">오류 발생</h1>
          <p className="text-gray-700 mb-4">{errorMessage || '페이지를 로드할 수 없습니다.'}</p>
          <p className="text-sm text-gray-500 mb-6">
            잠시 후 다시 시도해주세요.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface JoinProjectClientProps {
  projectId: string;
  shareLink: string;
}

/**
 * 프로젝트 참여 클라이언트 컴포넌트
 *
 * 기능:
 * 1. 참여하기 버튼 클릭
 * 2. 인증 상태 확인
 *    - 미로그인: /auth/login?returnUrl=/join/{shareLink}로 리다이렉트
 *    - 로그인: POST /api/projects/[projectId]/join 호출
 * 3. 성공 시 /projects/[projectId]로 이동
 * 4. 에러 처리 (멤버 제한, 중복 참여 등)
 */
export default function JoinProjectClient({
  projectId,
  shareLink,
}: JoinProjectClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoJoining, setIsAutoJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 로그인 후 페이지 복귀 시 자동으로 참여 처리
  useEffect(() => {
    // 이전에 로그인 페이지로 리다이렉트했었는지 확인
    const isReturningFromLogin = sessionStorage.getItem(
      `returning-from-login-${shareLink}`
    );

    if (isReturningFromLogin) {
      sessionStorage.removeItem(`returning-from-login-${shareLink}`);
      setIsAutoJoining(true);
      handleJoin();
    }
  }, [shareLink]);

  const handleJoin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null); // 에러 메시지 초기화

      // 1단계: 인증 상태 확인
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 미로그인 상태: 로그인 페이지로 리다이렉트
      if (!user) {
        // sessionStorage에 표시 저장 (로그인 후 자동 참여 처리)
        sessionStorage.setItem(`returning-from-login-${shareLink}`, 'true');

        // 로그인 페이지로 이동 (returnUrl 포함)
        const returnUrl = `/join/${shareLink}`;
        router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }

      // 2단계: 로그인 상태 - 참여 API 호출
      const response = await fetch(
        `/api/projects/${projectId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shareLink }),
        }
      );

      // 3단계: 응답 처리
      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error || '참여에 실패했습니다.';

        // 상태 코드별 처리
        if (response.status === 409) {
          // 멤버 제한 또는 중복 참여

          // 이미 참여한 경우 프로젝트 페이지로 이동
          if (errorMessage.includes('이미 참여한')) {
            toast.error(errorMessage);
            setTimeout(() => {
              router.push(`/projects/${projectId}`);
            }, 1500);
          } else {
            // 멤버 제한 에러는 버튼 아래에 표시
            setErrorMessage(errorMessage);
          }
        } else if (response.status === 404) {
          // 프로젝트를 찾을 수 없음
          setErrorMessage('프로젝트를 찾을 수 없습니다.');
        } else {
          setErrorMessage(errorMessage);
        }

        setIsLoading(false);
        return;
      }

      // 성공: 프로젝트 페이지로 이동
      toast.success('프로젝트에 참여했습니다!');
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 500);
    } catch (error) {
      console.error('참여 처리 에러:', error);
      setErrorMessage('참여 처리 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleJoin}
        disabled={isLoading || isAutoJoining}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors min-h-[48px] md:min-h-[44px]"
      >
        {isLoading || isAutoJoining ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>{isAutoJoining ? '참여 중...' : '처리 중...'}</span>
          </>
        ) : (
          <span>참여하기</span>
        )}
      </button>

      {/* 에러 메시지 표시 */}
      {errorMessage && (
        <p className="text-sm text-red-600 text-center font-medium">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

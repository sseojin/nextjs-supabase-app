'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Check } from 'lucide-react';

interface ShareLinkButtonProps {
  projectId: string;
  shareLink: string;
}

/**
 * 프로젝트의 공유 링크를 표시하고 복사 기능을 제공하는 컴포넌트
 * Clipboard API를 사용하여 링크를 클립보드에 복사합니다.
 * 성공 시 toast 알림을 표시합니다.
 */
export default function ShareLinkButton({
  projectId,
  shareLink,
}: ShareLinkButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 공유 링크 URL 구성
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${shareLink}`
    : `/join/${shareLink}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast.success('공유 링크가 복사되었습니다.');

      // 2초 후 복사 상태 리셋
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      toast.error('복사에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="w-full border border-gray-200 rounded-lg p-4 bg-gray-50">
      {/* 헤더: 공유 링크 제목 + 토글 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">공유 링크</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          {isExpanded ? '숨기기' : '보기'}
        </button>
      </div>

      {/* 링크 표시 영역 (토글 기반) */}
      {isExpanded && (
        <div className="space-y-3">
          {/* 링크 입력 필드 (읽기 전용) */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded p-3">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 text-sm text-gray-700 bg-transparent outline-none truncate"
            />
          </div>

          {/* 복사 버튼 */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors min-h-[44px]"
          >
            {isCopied ? (
              <>
                <Check size={18} />
                <span>복사됨</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                <span>링크 복사</span>
              </>
            )}
          </button>

          {/* 안내 문구 */}
          <p className="text-xs text-gray-600 text-center">
            이 링크를 공유하여 다른 사람을 초대할 수 있습니다.
          </p>
        </div>
      )}

      {/* 축약 상태: 간단한 버튼만 표시 */}
      {!isExpanded && (
        <p className="text-sm text-gray-600 mb-2">
          {shareLink} <span className="text-gray-400">클릭하여 보기</span>
        </p>
      )}
    </div>
  );
}

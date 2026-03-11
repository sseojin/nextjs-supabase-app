"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { CandidateWithUserVote } from "@/lib/types/candidate";

interface CandidateCardProps {
  candidate: CandidateWithUserVote;
  index: number;
  projectId: string;
  onVote: (candidateId: string, voteType: "agree" | "disagree") => Promise<void>;
  onDelete: (candidateId: string) => Promise<void>;
  onCardClick?: (candidate: CandidateWithUserVote) => void;
  onMemoUpdate?: (candidateId: string, memo: string) => void;
}

/**
 * 후보지 카드 컴포넌트
 * 장소 정보, 투표 현황을 표시하며, 번호 배지 색상으로 결과를 구분합니다
 * - 투표 없음: 회색 배지
 * - 찬성 >= 66%: 초록 배지 (최종 선정) - 카드 클릭 시 지도 포커스
 * - 찬성 < 66%: 빨강 배지 (선정 안됨)
 */
export default function CandidateCard({
  candidate,
  index,
  projectId,
  onVote,
  onDelete,
  onCardClick,
  onMemoUpdate,
}: CandidateCardProps) {
  // 메모 펼침/접힘 상태
  const [isMemoExpanded, setIsMemoExpanded] = useState(false);
  // 메모 작성/수정 모달 상태
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [memoText, setMemoText] = useState(candidate.memo || "");
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  // 로컬 메모 상태 (낙관적 업데이트)
  const [localMemo, setLocalMemo] = useState(candidate.memo || "");

  // Realtime 업데이트 시 candidate.memo 변경을 감지하여 localMemo 동기화
  useEffect(() => {
    setLocalMemo(candidate.memo || "");
  }, [candidate.memo]);

  // 백엔드에서 계산된 찬성 비율 사용 (전체 멤버 수 기준)
  const agreementRatio = candidate.agreement_ratio || 0;
  const totalVotes = candidate.votes_agree + candidate.votes_disagree;

  /**
   * 현재 사용자의 투표 상태 확인
   */
  const userVote = candidate.user_vote || null;

  /**
   * 투표 핸들러
   * 찬성 또는 반대 버튼 클릭 시 해당 타입으로 투표
   * 같은 버튼 재클릭 시에도 취소되지 않음 (항상 해당 타입으로 투표 유지)
   * 다른 버튼 클릭 시 투표 변경
   */
  const handleVote = async (e: React.MouseEvent, voteType: "agree" | "disagree") => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    try {
      // 항상 선택한 타입으로 투표 (재클릭 취소 기능 없음)
      await onVote(candidate.id, voteType);
    } catch (error) {
      console.error("투표 중 오류:", error);
      // 에러 처리는 CandidateList에서 토스트로 처리
    }
  };

  /**
   * 삭제 핸들러
   */
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    if (window.confirm("이 후보지를 삭제하시겠습니까?")) {
      try {
        await onDelete(candidate.id);
      } catch (error) {
        console.error("삭제 중 오류:", error);
        // 에러 처리는 CandidateList에서 토스트로 처리
      }
    }
  };

  /**
   * 네이버 지도에서 보기 핸들러
   * 장소명으로 검색하는 네이버 지도 URL 생성
   */
  const handleOpenNaverMap = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(candidate.location_name)}`;
    window.open(naverMapUrl, "_blank");
  };

  /**
   * 번호 배지 색상 계산 (결과와 일치)
   */
  const getBadgeColor = () => {
    if (totalVotes === 0) {
      return {
        bg: "bg-gray-200",
        text: "text-gray-700",
      };
    }
    if (agreementRatio >= 66) {
      return {
        bg: "bg-green-500",
        text: "text-white",
      };
    }
    return {
      bg: "bg-red-500",
      text: "text-white",
    };
  };

  const badgeColor = getBadgeColor();

  /**
   * 카드 클릭 핸들러
   * 찬성 >= 66%인 후보지만 클릭 가능 (초록 마커가 있는 경우)
   */
  const handleCardClick = () => {
    const agreementRatio = candidate.agreement_ratio || 0;
    if (agreementRatio >= 66 && onCardClick) {
      onCardClick(candidate);
    }
  };

  /**
   * 메모 작성/수정 모달 열기
   */
  const handleOpenMemoModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMemoText(localMemo);
    setIsMemoModalOpen(true);
  };

  /**
   * 메모 저장 핸들러
   * API 라우트는 쿠키 기반 인증을 사용하므로 Authorization 헤더 불필요
   * 메모 저장 후 Realtime이 자동으로 다른 참여자에게 변경 사항을 브로드캐스트
   */
  const handleSaveMemo = async () => {
    try {
      setIsSavingMemo(true);

      // 메모 업데이트 API 호출 (쿠키 기반 인증)
      const response = await fetch(`/api/projects/${projectId}/candidates/${candidate.id}/memo`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 쿠키 자동 전송
        body: JSON.stringify({ memo: memoText.trim() || null }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "메모 저장에 실패했습니다");
      }

      const result = await response.json();

      // 로컬 메모 상태 업데이트 (낙관적 업데이트)
      setLocalMemo(result.memo || "");

      // 부모 컴포넌트에 메모 업데이트 알림 (Realtime 동기화 트리거)
      if (onMemoUpdate) {
        onMemoUpdate(candidate.id, result.memo || "");
      }

      toast.success("메모가 저장되었습니다");
      setIsMemoModalOpen(false);

      // 메모가 있으면 자동으로 펼치기
      if (result.memo) {
        setIsMemoExpanded(true);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "메모 저장 중 오류가 발생했습니다";
      console.error("[CandidateCard] 메모 저장 에러:", error);
      toast.error(errorMessage);
    } finally {
      setIsSavingMemo(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div
        onClick={handleCardClick}
        className={`flex gap-2 p-3 ${
          (candidate.agreement_ratio || 0) >= 66 ? "cursor-pointer" : ""
        }`}
      >
        {/* 번호 배지 + 찬성률 (결과 색상과 일치) */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className={`w-8 h-8 rounded-full ${badgeColor.bg} flex items-center justify-center`}>
            <span className={`text-sm font-semibold ${badgeColor.text}`}>{index}</span>
          </div>
          {/* 찬성률 표시 */}
          {totalVotes > 0 && (
            <span className="text-[10px] font-semibold text-gray-600">
              ({agreementRatio.toFixed(0)}%)
            </span>
          )}
        </div>

        {/* 장소 정보 + 투표 UI */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* 장소명 + 네이버 지도 버튼 */}
          <div className="flex items-start gap-2.5">
            <h3 className="text-base font-semibold text-gray-900 break-words">
              {candidate.location_name}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenNaverMap}
              className="flex-shrink-0 text-[10px] h-6 gap-0.5 px-2"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              네이버 지도에서 보기
            </Button>
          </div>

          {/* 주소 */}
          <p className="text-[10px] text-gray-600 line-clamp-2">{candidate.address}</p>

          {/* 투표 버튼 */}
          <div className="flex items-center gap-1.5">
            {/* 찬성 버튼 */}
            <button
              onClick={(e) => handleVote(e, "agree")}
              className={`flex-1 flex items-center justify-center gap-0.5 text-[10px] font-medium px-2 py-1 rounded transition-colors ${
                userVote === "agree"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              aria-label="찬성"
            >
              <ThumbsUp className="w-3 h-3" />
              <span>{candidate.votes_agree}명</span>
            </button>

            {/* 반대 버튼 */}
            <button
              onClick={(e) => handleVote(e, "disagree")}
              className={`flex-1 flex items-center justify-center gap-0.5 text-[10px] font-medium px-2 py-1 rounded transition-colors ${
                userVote === "disagree"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              aria-label="반대"
            >
              <ThumbsDown className="w-3 h-3" />
              <span>{candidate.votes_disagree}명</span>
            </button>
          </div>

          {/* 메모 작성하기 / 메모 보기 버튼 */}
          <div className="flex items-center gap-2">
            {localMemo ? (
              // 메모가 있을 때: 메모 보기/숨기기 + 수정 버튼
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMemoExpanded(!isMemoExpanded);
                  }}
                  className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {isMemoExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      <span>메모 숨기기</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      <span>메모 보기</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleOpenMemoModal}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>수정</span>
                </button>
              </>
            ) : (
              // 메모가 없을 때: 메모 작성하기 버튼
              <button
                onClick={handleOpenMemoModal}
                className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                <span>메모 작성하기</span>
              </button>
            )}
          </div>
        </div>

        {/* 우측: 삭제 버튼 */}
        <div className="flex-shrink-0 flex items-start">
          {/* 삭제 버튼 (휴지통 아이콘) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-6 w-6"
            aria-label="삭제"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 메모 내용 (아코디언) */}
      {localMemo && isMemoExpanded && (
        <div className="px-3 pb-3 pt-0">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-700 whitespace-pre-wrap">{localMemo}</p>
          </div>
        </div>
      )}

      {/* 메모 작성/수정 모달 */}
      <Dialog open={isMemoModalOpen} onOpenChange={setIsMemoModalOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>{localMemo ? "메모 수정" : "메모 작성"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-900">메모</label>
                <span className="text-xs text-slate-600">{memoText.length}/200자</span>
              </div>
              <Textarea
                placeholder="이 장소에 대한 메모를 입력하세요"
                value={memoText}
                onChange={(e) => setMemoText(e.target.value.slice(0, 200))}
                maxLength={200}
                className="resize-none h-32"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsMemoModalOpen(false)}
              disabled={isSavingMemo}
            >
              취소
            </Button>
            <Button onClick={handleSaveMemo} disabled={isSavingMemo}>
              {isSavingMemo ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

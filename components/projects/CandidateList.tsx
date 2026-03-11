"use client";

// useState, useRef 제거: RealtimeContext가 상태 관리를 담당합니다
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeContext } from "@/components/realtime/RealtimeProvider";
import type { CandidateWithUserVote } from "@/lib/types/candidate";
import CandidateCard from "./CandidateCard";
import {
  sortCandidatesByCategory,
  groupCandidatesByCategory,
  CATEGORY_ORDER,
} from "@/lib/utils/candidates";

interface CandidateListProps {
  projectId: string;
  onCardClick?: (candidate: CandidateWithUserVote) => void;
}

/**
 * 후보지 목록 컴포넌트
 * useRealtimeContext를 통해 실시간 후보지 데이터를 받아 표시합니다
 * - 실시간 동기화: Supabase Realtime으로 다른 사용자의 변경 사항 자동 반영
 * - 낙관적 UI 업데이트: 투표 시 즉시 UI 반영 후 API 호출
 * - 실패 시 롤백: refetch() 호출로 서버 데이터 복구
 */
export default function CandidateList({ projectId, onCardClick }: CandidateListProps) {
  // Phase 5: RealtimeProvider에서 후보지 데이터 받기
  const { candidates, loading, error, refetch } = useRealtimeContext();

  // Phase 5: 로컬 상태 제거 (useRealtimeContext에서 관리됨)
  // useEffect, fetchCandidates 함수도 제거됨
  // refetch 함수는 useRealtimeContext에서 제공함

  /**
   * 투표 핸들러
   * 1단계: 낙관적 UI 업데이트 (로컬 상태 변경 - 향후 Context로 변경 가능)
   * 2단계: API 호출 (POST /api/projects/{projectId}/candidates/{candidateId}/vote)
   * 3단계: Realtime이 자동으로 데이터 동기화
   * 실패 시: 롤백 (refetch() 호출)
   *
   * 재클릭 취소 기능 없음: 항상 선택한 타입으로 투표
   */
  const handleVote = async (candidateId: string, voteType: "agree" | "disagree") => {
    try {
      // Phase 5: 기존 낙관적 UI 로직 유지
      // 로컬 상태를 변경하여 즉시 UI 반영 (향후 Context로 이동 가능)
      // 이 부분은 CandidateList가 props로 받지 않으므로, 부모의 상태 변경 불가
      // 따라서 API 호출만 수행하고 Realtime이 자동으로 동기화

      // 2단계: API 호출
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
      }

      const response = await fetch(`/api/projects/${projectId}/candidates/${candidateId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ vote_type: voteType }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData?.error || "투표에 실패했습니다");
        } catch {
          throw new Error(`투표 실패: HTTP ${response.status}`);
        }
      }

      // 3단계: Realtime이 candidate_votes 변경을 감지하고 자동으로 데이터 동기화
      // useRealtimeCandidates에서 fetchInitialData를 호출하여 최신 데이터 조회
      // showLoading=false로 로딩 표시 생략 (API 응답 후 곧바로 Realtime이 업데이트)
    } catch (err) {
      // 실패 시 롤백: refetch()를 호출하여 서버 데이터 복구
      const errorMessage = err instanceof Error ? err.message : "투표 중 오류가 발생했습니다";
      console.error("투표 에러:", err);
      toast.error(errorMessage);

      // refetch 함수를 호출하여 서버 데이터 복구
      await refetch();

      throw err;
    }
  };

  /**
   * 삭제 핸들러
   * DELETE /api/projects/{projectId}/candidates/{candidateId}
   */
  const handleDelete = async (candidateId: string) => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
      }

      const response = await fetch(`/api/projects/${projectId}/candidates/${candidateId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData?.error || "후보지 삭제에 실패했습니다");
        } catch {
          throw new Error(`삭제 실패: HTTP ${response.status}`);
        }
      }

      // Phase 5: Realtime이 candidates 테이블의 DELETE 이벤트를 감지하고 자동으로 데이터 동기화
      // useRealtimeCandidates에서 fetchInitialData를 호출하여 최신 데이터 조회
      toast.success("후보지가 삭제되었습니다");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다";
      console.error("삭제 에러:", err);
      toast.error(errorMessage);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
        <span className="text-sm text-gray-600">후보지를 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-700 underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
        <p className="text-sm text-slate-600">아직 등록된 후보지가 없습니다.</p>
        <p className="text-xs text-slate-500 mt-1">
          위 검색 창에서 장소를 검색하고 &quot;후보지 등록&quot; 버튼을 클릭하세요.
        </p>
      </div>
    );
  }

  /**
   * 후보지를 카테고리별로 정렬 (NaverMap과 동일한 순서)
   * 이렇게 하면 목록 번호와 지도 마커 번호가 항상 일치합니다
   */
  const sortedCandidates = sortCandidatesByCategory(candidates);

  /**
   * 정렬된 후보지를 카테고리별로 그룹화
   */
  const groupedCandidates = groupCandidatesByCategory(sortedCandidates);

  /**
   * 전체 후보지의 순번 (모든 카테고리에서 연속된 번호)
   * 지도 마커 번호와 일치
   */
  let globalIndex = 1;

  /**
   * 카테고리별 색상 매핑
   */
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "명소/랜드마크":
        return "border-blue-500";
      case "식당":
        return "border-orange-500";
      case "카페":
        return "border-amber-600";
      case "바(bar)":
        return "border-purple-500";
      case "소품샵/쇼룸":
        return "border-pink-500";
      case "기타":
        return "border-slate-400";
      default:
        return "border-slate-400";
    }
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">후보지 ({candidates.length})</h3>
      </div>

      {/* 카테고리별 후보지 목록 */}
      <div className="space-y-8">
        {CATEGORY_ORDER.map((category) => {
          // 해당 카테고리에 후보지가 없으면 표시하지 않음
          const candidatesInCategory = groupedCandidates[category];
          if (!candidatesInCategory || candidatesInCategory.length === 0) {
            return null;
          }

          return (
            <div key={category} className="space-y-2">
              {/* 카테고리 헤더 - 구분선 스타일 */}
              <div
                className={`flex items-center gap-3 border-l-4 ${getCategoryColor(category)} pl-3 py-1`}
              >
                <span className="text-sm font-bold text-slate-800">{category}</span>
                <span className="text-xs text-slate-500 font-medium">
                  {candidatesInCategory.length}개
                </span>
              </div>

              {/* 해당 카테고리의 후보지 목록 */}
              <div className="space-y-3">
                {candidatesInCategory.map((candidate) => {
                  const currentIndex = globalIndex++;
                  return (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      index={currentIndex}
                      projectId={projectId}
                      onVote={handleVote}
                      onDelete={handleDelete}
                      onCardClick={onCardClick}
                      onMemoUpdate={() => {
                        // Phase 5: Realtime이 자동으로 메모 UPDATE 이벤트를 감지하고 동기화
                        // useRealtimeCandidates의 postgres_changes 리스너가 UPDATE 감지
                        // → fetchInitialData(false) 자동 호출 → 모든 참여자에게 변경 사항 반영
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

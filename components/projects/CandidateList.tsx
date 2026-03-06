"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { CandidateWithUserVote } from "@/lib/types/candidate";
import CandidateCard from "./CandidateCard";
import {
  sortCandidatesByCategory,
  groupCandidatesByCategory,
  CATEGORY_ORDER,
} from "@/lib/utils/candidates";

interface CandidateListProps {
  projectId: string;
  candidates?: CandidateWithUserVote[];
  onCandidatesUpdate?: (candidates: CandidateWithUserVote[]) => void;
  totalMembers?: number; // 전체 멤버 수 (투표율 계산용)
  onCardClick?: (candidate: CandidateWithUserVote) => void;
}

/**
 * 후보지 목록 컴포넌트
 * 후보지를 조회, 투표, 삭제하는 기능을 제공합니다
 * - 낙관적 UI 업데이트: 투표 시 즉시 UI 반영 후 API 호출
 * - 실패 시 롤백: fetchCandidates 재호출
 */
export default function CandidateList({
  projectId,
  candidates: parentCandidates,
  onCandidatesUpdate,
  totalMembers = 2, // 기본값: 2명 (creator + member)
  onCardClick,
}: CandidateListProps) {
  const [candidates, setCandidates] = useState<CandidateWithUserVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 첫 마운트 시에만 데이터 조회 (무한로딩 방지)
  const hasInitializedRef = useRef(false);

  /**
   * 후보지 목록 조회
   * GET /api/projects/{projectId}/candidates
   * @param showLoading - 로딩 표시 여부 (기본값: true)
   */
  const fetchCandidates = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
      }

      const response = await fetch(`/api/projects/${projectId}/candidates`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData?.error || "후보지를 불러올 수 없습니다");
        } catch {
          throw new Error(`후보지 조회 실패: HTTP ${response.status}`);
        }
      }

      const data = await response.json();
      setCandidates(data);

      // 부모 컴포넌트에 업데이트 알림 (지도 마커 업데이트용)
      if (onCandidatesUpdate) {
        onCandidatesUpdate(data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "후보지 조회 중 오류가 발생했습니다";
      setError(errorMessage);
      console.error("후보지 조회 에러:", err);
      toast.error(errorMessage);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  /**
   * 컴포넌트 마운트 시 후보지 조회 (한 번만 실행)
   * 부모에서 전달받은 후보지가 있으면 그것을 사용, 없으면 API에서 조회
   */
  useEffect(() => {
    // 이미 초기화되었으면 실행하지 않음
    if (hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    // 부모에서 전달받은 후보지가 있으면 사용
    if (parentCandidates && parentCandidates.length > 0) {
      setCandidates(parentCandidates);
      setLoading(false);
    } else {
      // parentCandidates가 명시적으로 빈 배열이면 빈 상태로 표시
      if (Array.isArray(parentCandidates)) {
        setCandidates([]);
        setLoading(false);
      } else {
        // parentCandidates가 undefined이면 API에서 조회
        fetchCandidates();
      }
    }
  }, []);

  /**
   * 부모에서 후보지가 업데이트되면 로컬 상태 반영
   * 초기화 후에만 반응하여 무한루프 방지
   */
  useEffect(() => {
    if (!hasInitializedRef.current) {
      return;
    }

    // parentCandidates가 배열이면 (빈 배열 [] 포함) 업데이트
    if (Array.isArray(parentCandidates)) {
      setCandidates(parentCandidates);
      setLoading(false);
    }
  }, [parentCandidates]);

  /**
   * 투표 핸들러
   * 1단계: 낙관적 UI 업데이트 (즉시 반영)
   * 2단계: API 호출 (POST /api/projects/{projectId}/candidates/{candidateId}/vote)
   * 3단계: 서버 응답으로 실제 값 업데이트
   * 실패 시: 롤백 (fetchCandidates 재호출)
   *
   * 재클릭 취소 기능 없음: 항상 선택한 타입으로 투표
   */
  const handleVote = async (candidateId: string, voteType: "agree" | "disagree") => {
    try {
      // 1단계: 낙관적 UI 업데이트
      setCandidates((prev) =>
        prev.map((candidate) => {
          if (candidate.id !== candidateId) return candidate;

          const oldVote = candidate.user_vote;
          let newVotes_agree = candidate.votes_agree;
          let newVotes_disagree = candidate.votes_disagree;

          // 기존 투표 제거
          if (oldVote === "agree") {
            newVotes_agree -= 1;
          } else if (oldVote === "disagree") {
            newVotes_disagree -= 1;
          }

          // 새 투표 추가
          if (voteType === "agree") {
            newVotes_agree += 1;
          } else if (voteType === "disagree") {
            newVotes_disagree += 1;
          }

          // 찬성 비율 계산 (전체 멤버 수 기준)
          const agreement_ratio = totalMembers === 0 ? 0 : (newVotes_agree / totalMembers) * 100;

          return {
            ...candidate,
            votes_agree: newVotes_agree,
            votes_disagree: newVotes_disagree,
            user_vote: voteType,
            agreement_ratio: Math.round(agreement_ratio * 10) / 10,
          };
        }),
      );

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

      // 3단계: 투표 후 **모든 후보지를 서버에서 다시 조회** (동시성 문제 해결)
      // 낙관적 UI를 서버 데이터로 완전히 덮어씌움으로써
      // race condition 방지
      // showLoading=false로 로딩 표시 생략 (이미 낙관적 UI로 반응성 제공함)
      await fetchCandidates(false);

      // 부모에도 알림 (fetchCandidates에서 onCandidatesUpdate 호출됨)
    } catch (err) {
      // 실패 시 롤백: 현재 상태로 복원
      const errorMessage = err instanceof Error ? err.message : "투표 중 오류가 발생했습니다";
      console.error("투표 에러:", err);
      toast.error(errorMessage);

      // 부모에서 받은 후보지 데이터로 복원 (또는 다시 조회)
      if (parentCandidates) {
        setCandidates(parentCandidates);
      } else {
        await fetchCandidates();
      }

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

      // 성공: 서버에서 모든 후보지를 다시 조회하여 일관성 보장
      // showLoading=false로 로딩 표시 생략
      await fetchCandidates(false);

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
          onClick={() => fetchCandidates()}
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
                      onMemoUpdate={(candidateId, memo) => {
                        // 메모 업데이트 시 로컬 상태 반영
                        setCandidates((prev) =>
                          prev.map((c) => (c.id === candidateId ? { ...c, memo } : c)),
                        );
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

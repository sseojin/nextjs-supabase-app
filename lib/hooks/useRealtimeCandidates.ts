"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CandidateWithUserVote } from "@/lib/types/candidate";
import type { RealtimeContextValue } from "@/lib/types/realtime";

/**
 * Supabase Realtime을 구독하여 후보지 및 투표 데이터를 실시간으로 동기화하는 훅
 *
 * 작동 원리:
 * 1. 초기 로드: API에서 후보지 데이터 조회
 * 2. Realtime 구독: WebSocket을 통해 candidates, candidate_votes 테이블 변경 감지
 * 3. 자동 업데이트: 다른 사용자의 후보지 추가/삭제/투표 변화가 즉시 반영됨
 * 4. 정리: 컴포넌트 언마운트 시 구독 해제 및 메모리 누수 방지
 *
 * @param projectId - 프로젝트 ID (Realtime 채널 고유성 보장)
 * @returns { candidates, loading, error, refetch } - 후보지 목록, 상태, 에러, 수동 재조회 함수
 */
export function useRealtimeCandidates(projectId: string): RealtimeContextValue {
  const [candidates, setCandidates] = useState<CandidateWithUserVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * API를 통해 후보지 목록 조회
   * 서버에서 투표 정보를 포함한 후보지 데이터 반환
   *
   * @param showLoading - 로딩 표시 여부 (기본값: true)
   */
  const fetchInitialData = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Supabase 세션에서 토큰 가져오기
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
      }

      // GET /api/projects/{projectId}/candidates 호출
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
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "후보지 조회 중 오류가 발생했습니다";
      setError(errorMessage);
      console.error("[useRealtimeCandidates] 데이터 조회 에러:", err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  /**
   * Realtime 채널 구독
   * candidates, candidate_votes 테이블의 변경 사항을 감지하고 자동 업데이트
   */
  const subscribeToRealtime = () => {
    const supabase = createClient();

    // 프로젝트별 고유 채널 생성
    const channel = supabase
      .channel(`candidates-${projectId}`)

      // 1단계: candidates 테이블 변경 감지
      // INSERT, UPDATE, DELETE 모두 감지하여 해당 후보지 업데이트
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE 모두 감지
          schema: "public",
          table: "candidates",
          filter: `project_id=eq.${projectId}`, // 현재 프로젝트만 필터링
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // 새 후보지 추가
            // payload.new에 추가된 후보지 정보가 포함됨
            // 주의: payload.new는 기본 후보지만 포함 (user_vote, agreement_ratio 없음)
            // 따라서 전체 재조회로 정확한 데이터 확보
            fetchInitialData(false);
          } else if (payload.eventType === "UPDATE") {
            // 후보지 정보 업데이트 (위치, 메모 등)
            fetchInitialData(false);
          } else if (payload.eventType === "DELETE") {
            // 후보지 삭제
            fetchInitialData(false);
          }
        },
      )

      // 2단계: candidate_votes 테이블 변경 감지
      // 투표가 추가/수정/삭제되면 전체 후보지 재조회
      // 이유: 투표 수 + 찬성 비율 + 사용자 투표 상태를 정확히 계산하기 위해
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE 모두 감지
          schema: "public",
          table: "candidate_votes",
          // filter 없음: 모든 프로젝트의 투표 감지 (후보지로 필터링됨)
        },
        () => {
          // 투표 변경 시 전체 후보지 재조회
          // candidates 테이블의 votes_agree, votes_disagree가 트리거로 자동 업데이트됨
          // 그리고 사용자의 현재 투표 상태도 재계산됨
          fetchInitialData(false);
        },
      )

      // 3단계: 구독 상태 모니터링
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          setError(null);
        } else if (status === "CHANNEL_ERROR") {
          console.error("[useRealtimeCandidates] ❌ Realtime 연결 실패");
          console.error("[useRealtimeCandidates] 에러 상세:", err);
          setError("실시간 동기화에 실패했습니다. 페이지를 새로고침해주세요.");
        } else if (status === "TIMED_OUT") {
          console.error("[useRealtimeCandidates] ⏱️ Realtime 연결 시간 초과");
          setError("실시간 동기화 연결 시간이 초과되었습니다.");
        }
      });

    return channel;
  };

  /**
   * 초기 로드 및 Realtime 구독 설정
   * 컴포넌트 마운트 시 한 번 실행 (projectId 변경 시 재실행)
   * 언마운트 시 구독 해제하여 메모리 누수 방지
   */
  useEffect(() => {
    // 초기 데이터 로드
    fetchInitialData();

    // Realtime 구독 시작
    const channel = subscribeToRealtime();

    // Fallback: Realtime 실패 시 10초마다 폴링
    const pollingInterval = setInterval(() => {
      if (error) {
        fetchInitialData(false);
      }
    }, 10000); // 10초마다

    // cleanup: 컴포넌트 언마운트 시 구독 해제 및 폴링 중단
    return () => {
      channel.unsubscribe();
      clearInterval(pollingInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  /**
   * 수동 재조회 함수
   * 에러 발생 시 사용자가 "다시 시도" 버튼으로 호출할 수 있음
   */
  const refetch = async () => {
    await fetchInitialData();
  };

  return {
    candidates,
    loading,
    error,
    refetch,
  };
}

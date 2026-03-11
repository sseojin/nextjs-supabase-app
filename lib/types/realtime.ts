// Phase 5: Realtime 동기화 타입 정의

import type { CandidateWithUserVote } from "./candidate";

/**
 * Realtime Context에서 제공하는 값
 * 후보지 목록, 로딩 상태, 에러, 수동 재조회 함수를 포함합니다
 */
export interface RealtimeContextValue {
  candidates: CandidateWithUserVote[]; // 후보지 목록 (투표 정보 포함)
  loading: boolean; // 초기 로드 중 여부
  error: string | null; // 에러 메시지
  refetch: () => Promise<void>; // 수동 재조회 함수 (에러 복구용)
}

/**
 * RealtimeProvider 컴포넌트의 Props
 */
export interface RealtimeProviderProps {
  projectId: string; // 프로젝트 ID (Realtime 채널 고유성 보장)
  children: React.ReactNode; // 자식 컴포넌트
}

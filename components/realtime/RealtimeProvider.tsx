"use client";

import React, { createContext, useContext } from "react";
import { useRealtimeCandidates } from "@/lib/hooks/useRealtimeCandidates";
import type { RealtimeContextValue, RealtimeProviderProps } from "@/lib/types/realtime";

/**
 * Realtime 데이터를 제공하는 Context
 * RealtimeProvider 내부에서만 유효합니다
 */
const RealtimeContext = createContext<RealtimeContextValue | null>(null);

/**
 * Realtime Provider 컴포넌트
 * 자식 컴포넌트들이 useRealtimeContext 훅으로 실시간 후보지 데이터에 접근할 수 있게 합니다
 *
 * 사용 예시:
 * ```tsx
 * <RealtimeProvider projectId={projectId}>
 *   <CandidateList />
 *   <NaverMap />
 * </RealtimeProvider>
 * ```
 */
export function RealtimeProvider({ projectId, children }: RealtimeProviderProps) {
  // useRealtimeCandidates 훅에서 실시간 후보지 데이터 가져오기
  const value = useRealtimeCandidates(projectId);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

/**
 * Realtime Context 데이터를 사용하는 훅
 * RealtimeProvider 내부의 자식 컴포넌트에서만 호출 가능
 *
 * @throws Error - RealtimeProvider 외부에서 호출 시 에러 발생
 *
 * 사용 예시:
 * ```tsx
 * const { candidates, loading, error, refetch } = useRealtimeContext();
 * ```
 */
export function useRealtimeContext(): RealtimeContextValue {
  const context = useContext(RealtimeContext);

  if (!context) {
    throw new Error(
      "useRealtimeContext는 RealtimeProvider 내부에서만 사용 가능합니다. " +
        "상위 컴포넌트가 <RealtimeProvider>로 감싸져 있는지 확인해주세요.",
    );
  }

  return context;
}

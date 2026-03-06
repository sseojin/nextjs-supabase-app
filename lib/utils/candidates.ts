import type { CandidateWithUserVote } from "@/lib/types/candidate";

/**
 * 카테고리 순서 정의
 * AddLocationModal의 카테고리 순서와 일치
 */
export const CATEGORY_ORDER = ["명소/랜드마크", "식당", "카페", "바(bar)", "소품샵/쇼룸", "기타"];

/**
 * 후보지를 카테고리별로 정렬하는 함수
 * 1순위: 카테고리 순서 (CATEGORY_ORDER 기준)
 * 2순위: 생성 시간 (created_at 오름차순)
 *
 * 이 함수를 사용하면 CandidateList와 NaverMap의 번호가 항상 일치합니다.
 *
 * @param candidates - 정렬할 후보지 배열
 * @returns 카테고리별로 정렬된 후보지 배열
 */
export function sortCandidatesByCategory(
  candidates: CandidateWithUserVote[],
): CandidateWithUserVote[] {
  return [...candidates].sort((a, b) => {
    // 카테고리가 없으면 "기타"로 처리
    const categoryA = a.category || "기타";
    const categoryB = b.category || "기타";

    // 1순위: 카테고리 순서
    const indexA = CATEGORY_ORDER.indexOf(categoryA);
    const indexB = CATEGORY_ORDER.indexOf(categoryB);

    // 카테고리가 CATEGORY_ORDER에 없으면 맨 뒤로
    const orderA = indexA === -1 ? CATEGORY_ORDER.length : indexA;
    const orderB = indexB === -1 ? CATEGORY_ORDER.length : indexB;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // 2순위: 생성 시간 (오름차순)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/**
 * 정렬된 후보지 배열을 카테고리별로 그룹화하는 함수
 *
 * @param candidates - 정렬된 후보지 배열 (sortCandidatesByCategory 결과)
 * @returns 카테고리별로 그룹화된 객체
 */
export function groupCandidatesByCategory(
  candidates: CandidateWithUserVote[],
): Record<string, CandidateWithUserVote[]> {
  const grouped: Record<string, CandidateWithUserVote[]> = {};

  candidates.forEach((candidate) => {
    const category = candidate.category || "기타";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(candidate);
  });

  return grouped;
}

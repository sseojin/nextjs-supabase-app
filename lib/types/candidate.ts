// Phase 4: 후보지 및 투표 타입 정의
// Supabase candidates, candidate_votes, final_locations 테이블의 스키마와 일치

/**
 * 후보지 정보
 * Supabase candidates 테이블의 스키마와 일치
 */
export interface Candidate {
  id: string; // 후보지 고유 ID (UUID)
  project_id: string; // 프로젝트 ID (FK)
  location_name: string; // 장소명
  address: string; // 주소
  category?: string; // 카테고리 (음식점, 카페, 영화관 등)
  lat: number; // 위도
  lng: number; // 경도
  created_by: string; // 후보지 등록자 (FK)
  votes_agree: number; // 찬성 투표 수
  votes_disagree: number; // 반대 투표 수
  memo?: string; // 후보지에 대한 메모 (선택사항, 최대 200자)
  created_at: Date; // 생성 시간
  updated_at: Date; // 마지막 수정 시간
}

/**
 * 투표 기록
 * Supabase candidate_votes 테이블의 스키마와 일치
 */
export interface CandidateVote {
  id: string; // 투표 고유 ID
  candidate_id: string; // 후보지 ID (FK)
  user_id: string; // 투표자 사용자 ID (FK)
  vote_type: "agree" | "disagree"; // 투표 유형 (찬성 또는 반대)
  created_at: Date; // 투표 생성 시간
  updated_at: Date; // 투표 수정 시간
}

/**
 * 최종 선정 장소
 * Supabase final_locations 테이블의 스키마와 일치
 * 찬성 >= 66%인 후보지만 저장됨
 */
export interface FinalLocation {
  id: string; // 최종 장소 고유 ID
  project_id: string; // 프로젝트 ID (FK)
  candidate_id: string; // 후보지 ID (FK)
  location_name: string; // 장소명
  address: string; // 주소
  category?: string; // 카테고리
  lat: number; // 위도
  lng: number; // 경도
  votes_agree: number; // 찬성 투표 수
  votes_disagree: number; // 반대 투표 수
  agreement_ratio: number; // 찬성 비율 (0-100)
  created_at: Date; // 저장 시간
  updated_at: Date; // 수정 시간
}

/**
 * 후보지 + 사용자 투표 정보
 * CandidateCard 컴포넌트에서 사용
 */
export interface CandidateWithUserVote extends Candidate {
  user_vote?: "agree" | "disagree" | null; // 현재 사용자의 투표 (null: 미투표)
  agreement_ratio?: number; // 계산된 찬성 비율 (0-100)
}

/**
 * 후보지 생성 요청 본문
 */
export interface CreateCandidateRequest {
  location_name: string;
  address: string;
  category?: string;
  lat: number;
  lng: number;
  memo?: string;
}

/**
 * 투표 요청 본문
 */
export interface VoteCandidateRequest {
  vote_type: "agree" | "disagree";
}

/**
 * 투표 응답 본문
 */
export interface VoteCandidateResponse {
  candidate: {
    id: string;
    votes_agree: number;
    votes_disagree: number;
    user_vote: "agree" | "disagree" | null;
    agreement_ratio: number;
  };
}

/**
 * 최종 장소 저장 요청 본문
 */
export interface CreateFinalLocationRequest {
  candidate_id: string;
}

/**
 * 최종 장소 저장 응답 본문
 */
export interface CreateFinalLocationResponse {
  id: string;
  project_id: string;
  candidate_id: string;
  location_name: string;
  address: string;
  votes_agree: number;
  votes_disagree: number;
  agreement_ratio: number;
  created_at: string;
}

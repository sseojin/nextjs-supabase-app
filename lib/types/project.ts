// Phase 1: 데이터베이스 기반 타입 정의

/**
 * 프로젝트 정보
 * Supabase projects 테이블의 스키마와 일치
 * Phase 0 로컬 상태와 Phase 1+ DB 기반 모두 지원
 * creator 또는 member로서의 역할 정보 포함
 */
export interface Project {
  id: string; // 프로젝트 고유 ID (UUID 또는 임시 ID)
  title: string; // 프로젝트 제목 (최소 2자 이상)
  date: Date; // 프로젝트 날짜
  role: "creator" | "member"; // 현재 사용자의 역할 (배지 색상: creator=red, member=blue)
  // Phase 1 필드 (DB 기반, optional)
  creator_id?: string; // 프로젝트 생성자 (creator) 사용자 ID
  share_link?: string; // 공유 링크 (nanoid 10자)
  status?: "active" | "archived" | "completed"; // 프로젝트 상태
  location?: string; // 프로젝트 장소 (선택사항, Phase 3에서 사용)
  created_at?: Date; // 생성 시간
  updated_at?: Date; // 마지막 수정 시간
}

/**
 * 프로젝트 멤버 정보
 * Supabase project_members 테이블의 스키마와 일치
 */
export interface ProjectMember {
  id: string; // 멤버십 고유 ID
  project_id: string; // 프로젝트 ID (FK)
  user_id: string; // 사용자 ID (FK)
  role: "creator" | "member"; // 멤버 역할
  display_color: string; // 배지 표시 색상 (creator: #9333EA, member: #EAB308)
  joined_at: Date; // 참여 시간
  user_email?: string; // 사용자 이메일 (auth.users에서 조회)
  user_name?: string; // 사용자 이름 (auth.users.user_metadata.full_name)
}

/**
 * 프로젝트 + 멤버 목록 정보
 * 프로젝트 상세 페이지에서 사용
 */
export interface ProjectWithMembers extends Project {
  members: ProjectMember[]; // 프로젝트의 모든 멤버 목록
}

/**
 * 캘린더 셀에 표시할 날짜 정보
 * 날짜별 프로젝트 목록과 UI 상태 포함
 */
export interface DateCellData {
  date: Date; // 셀의 날짜
  isCurrentMonth: boolean; // 현재 월에 포함되는 날짜인지 (회색 처리용)
  projects: Project[]; // 해당 날짜의 프로젝트 목록
}

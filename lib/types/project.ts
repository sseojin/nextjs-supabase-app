// Phase 0: 로컬 상태용 타입 정의 (Phase 1에서 DB 타입으로 확장)

/**
 * 프로젝트 정보
 * Phase 0에서는 로컬 상태로만 관리
 */
export interface Project {
  id: string; // 임시 ID (uuid 또는 Date.now() 사용)
  title: string; // 프로젝트 제목 (최소 2자 이상)
  date: Date; // 프로젝트 날짜
  role: "creator" | "member"; // 배지 색상 구분 (creator=red, member=blue)
  createdAt: Date; // 생성 시간
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

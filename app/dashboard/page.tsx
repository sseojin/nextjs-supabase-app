import Calendar from "@/components/calendar/Calendar";

/**
 * 대시보드 메인 페이지
 * Calendar 컴포넌트를 렌더링하는 래퍼
 * Phase 0: 로컬 상태 기반 캘린더
 * Phase 1: API 연동으로 업그레이드 예정
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* 페이지 제목 */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">내 캘린더</h2>
        <p className="text-sm text-slate-600">데이트 일정을 캘린더에서 관리하세요</p>
      </div>

      {/* Calendar 컴포넌트 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 md:p-6">
        <Calendar />
      </div>
    </div>
  );
}

import { format } from "date-fns";
import type { DateCellData } from "@/lib/types/project";

interface DateCellProps {
  dateCell: DateCellData;
  onDateClick: (dateCell: DateCellData) => void;
}

/**
 * 캘린더의 개별 날짜 셀 컴포넌트
 *
 * 기능:
 * - 날짜 번호 표시
 * - 이전/다음 달 날짜는 회색으로 표시
 * - 프로젝트 배지 표시 (최대 2개 + N)
 * - creator: 빨강 (bg-red-500)
 * - member: 파랑 (bg-blue-500)
 * - 호버/터치 효과
 */
export default function DateCell({ dateCell, onDateClick }: DateCellProps) {
  const { date, isCurrentMonth, projects } = dateCell;

  // 배지 분리: 표시할 배지 (최대 2개)와 숨겨진 배지 개수
  const displayedBadges = projects.slice(0, 2);
  const hiddenBadgesCount = Math.max(0, projects.length - 2);

  // 배지 색상 함수
  const getBadgeColor = (role: "creator" | "member"): string => {
    return role === "creator" ? "bg-red-500 text-white" : "bg-blue-500 text-white";
  };

  return (
    <div
      onClick={() => onDateClick(dateCell)}
      className={`
        min-h-[60px] md:min-h-[80px] p-2 md:p-3
        border border-slate-200 rounded-lg
        flex flex-col gap-2
        transition-all duration-200
        ${
          isCurrentMonth
            ? "bg-white cursor-pointer hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100"
            : "bg-slate-50 cursor-default text-slate-400"
        }
      `}
    >
      {/* 날짜 번호 */}
      <span
        className={`
          text-sm md:text-base font-semibold
          ${isCurrentMonth ? "text-slate-900" : "text-slate-400"}
        `}
      >
        {format(date, "d")}
      </span>

      {/* 배지 컨테이너 */}
      {isCurrentMonth && projects.length > 0 && (
        <div className="flex flex-col gap-1 flex-1">
          {/* 배지 목록 */}
          <div className="flex flex-col gap-1">
            {displayedBadges.map((project) => (
              <div
                key={`${project.id}-${project.role}`}
                className={`
                  text-xs px-2 py-1 rounded
                  ${getBadgeColor(project.role)}
                  truncate
                  transition-opacity duration-200
                `}
                onClick={(e) => {
                  // 배지 클릭 시 부모 클릭 이벤트 방지
                  // Phase 1에서 프로젝트 상세 페이지로 라우팅 추가 예정
                  e.stopPropagation();
                }}
                title={project.title}
              >
                {project.title}
              </div>
            ))}
          </div>

          {/* +N 배지 (숨겨진 배지 표시) */}
          {hiddenBadgesCount > 0 && (
            <div className="text-xs text-slate-600 px-2 font-medium">+{hiddenBadgesCount}</div>
          )}
        </div>
      )}
    </div>
  );
}

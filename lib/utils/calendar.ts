import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import type { DateCellData, Project } from "@/lib/types/project";

/**
 * 캘린더에 표시할 7x6 그리드의 모든 날짜를 반환
 * 이전/다음 달의 날짜도 포함하여 정확히 42개(7x6)의 날짜 반환
 * @param currentDate - 기준 날짜
 * @returns 42개의 Date 배열
 */
export const getCalendarDates = (currentDate: Date): Date[] => {
  // 현재 달의 시작과 끝
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);

  // 시작 날짜의 일요일부터 끝 날짜의 토요일까지
  const calendarStart = new Date(start);
  calendarStart.setDate(calendarStart.getDate() - start.getDay());

  const calendarEnd = new Date(end);
  const daysUntilSaturday = 6 - end.getDay();
  calendarEnd.setDate(calendarEnd.getDate() + daysUntilSaturday);

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
};

/**
 * 날짜를 YYYY-MM-DD 형식의 문자열로 변환
 * 프로젝트를 날짜별로 매핑할 때 사용하는 키 생성 함수
 * @param date - 변환할 날짜
 * @returns YYYY-MM-DD 형식의 문자열
 */
export const formatDateKey = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

/**
 * 월과 연도를 한국어로 포맷팅
 * 예: "2024년 2월"
 * @param date - 포맷할 날짜
 * @returns 한국어로 포맷된 월/년 문자열
 */
export const formatMonthYear = (date: Date): string => {
  return format(date, "yyyy년 M월", { locale: ko });
};

/**
 * 다음 달로 이동
 * @param currentDate - 현재 날짜
 * @returns 다음 달의 같은 일자 (또는 가능한 가장 가까운 날자)
 */
export const getNextMonth = (currentDate: Date): Date => {
  return addMonths(currentDate, 1);
};

/**
 * 이전 달로 이동
 * @param currentDate - 현재 날짜
 * @returns 이전 달의 같은 일자 (또는 가능한 가장 가까운 날자)
 */
export const getPreviousMonth = (currentDate: Date): Date => {
  return subMonths(currentDate, 1);
};

/**
 * 캘린더 날짜 배열에 프로젝트를 매핑
 * 각 날짜 셀에 해당 날짜의 프로젝트 목록을 포함시킴
 * @param dates - getCalendarDates()에서 반환한 날짜 배열
 * @param currentMonth - 현재 표시 중인 달
 * @param projects - 전체 프로젝트 목록
 * @returns DateCellData 배열
 */
export const mapProjectsToDates = (
  dates: Date[],
  currentMonth: Date,
  projects: Project[],
): DateCellData[] => {
  // 프로젝트를 날짜 키로 그룹화하여 빠른 조회
  const projectsByDate = new Map<string, Project[]>();

  for (const project of projects) {
    const key = formatDateKey(project.date);
    if (!projectsByDate.has(key)) {
      projectsByDate.set(key, []);
    }
    projectsByDate.get(key)!.push(project);
  }

  // 각 날짜 셀에 해당 프로젝트 할당
  return dates.map((date) => {
    const dateKey = formatDateKey(date);
    return {
      date,
      isCurrentMonth: isSameMonth(date, currentMonth),
      projects: projectsByDate.get(dateKey) || [],
    };
  });
};

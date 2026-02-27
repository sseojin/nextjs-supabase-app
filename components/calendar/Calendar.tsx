"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCalendarDates,
  mapProjectsToDates,
  formatMonthYear,
  getNextMonth,
  getPreviousMonth,
} from "@/lib/utils/calendar";
import type { Project, DateCellData } from "@/lib/types/project";
import DateCell from "./DateCell";
import CreateProjectModal from "./CreateProjectModal";

/**
 * 캘린더 메인 컴포넌트
 * Phase 0: 로컬 상태 기반 프로젝트 관리
 * Phase 1: API 연동으로 업그레이드 예정
 *
 * 기능:
 * - 7x6 그리드 렌더링 (월 단위)
 * - 이전/다음 달 버튼으로 월 이동
 * - 날짜 클릭 시 프로젝트 생성 모달 열기
 * - 프로젝트 생성 시 배지 표시
 * - 배지 색상: creator(빨강), member(파랑)
 */
export default function Calendar() {
  // 상태 관리
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 캘린더 데이터 생성
  const calendarDates = getCalendarDates(currentMonth);
  const datesCellData = mapProjectsToDates(calendarDates, currentMonth, projects);

  /**
   * 날짜 셀 클릭 핸들러
   * 현재 달의 날짜만 클릭 가능
   */
  const handleDateClick = (dateCell: DateCellData) => {
    if (dateCell.isCurrentMonth) {
      setSelectedDate(dateCell.date);
      setIsModalOpen(true);
    }
  };

  /**
   * 프로젝트 생성 핸들러
   * 새로운 프로젝트를 projects 배열에 추가
   * Phase 0: 로컬 상태만 업데이트
   * Phase 1: API 호출로 변경 예정
   */
  const handleCreateProject = (title: string, date: Date) => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      title,
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      role: "creator", // Phase 0: 항상 creator로 설정
      createdAt: new Date(),
    };

    setProjects([...projects, newProject]);
    setIsModalOpen(false);
  };

  /**
   * 월 이동 핸들러
   */
  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };

  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth));
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 헤더: 월/년 표시 및 네비게이션 버튼 */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">{formatMonthYear(currentMonth)}</h3>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            onClick={handlePreviousMonth}
            aria-label="이전 달"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            onClick={handleNextMonth}
            aria-label="다음 달"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <div className="w-full flex flex-col gap-1 md:gap-2">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div
              key={day}
              className="flex items-center justify-center h-10 text-sm font-semibold text-slate-700"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 셀 그리드 (7x6) */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {datesCellData.map((dateCell) => (
            <DateCell
              key={dateCell.date.toISOString()}
              dateCell={dateCell}
              onDateClick={handleDateClick}
            />
          ))}
        </div>
      </div>

      {/* 프로젝트 생성 모달 */}
      {selectedDate && (
        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDate(null);
          }}
          selectedDate={selectedDate}
          onCreateProject={handleCreateProject}
        />
      )}

      {/* Phase 0: 통계 표시 */}
      <div className="border-t border-slate-200 pt-4">
        <p className="text-sm text-slate-600">총 {projects.length}개 프로젝트</p>
      </div>
    </div>
  );
}

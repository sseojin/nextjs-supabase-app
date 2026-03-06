"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
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
 * Phase 1: API 기반 프로젝트 관리
 *
 * 기능:
 * - 월별 프로젝트 조회 (GET /api/projects?year=YYYY&month=MM)
 * - 7x6 그리드 렌더링 (월 단위)
 * - 이전/다음 달 버튼으로 월 이동
 * - 날짜 클릭 시 프로젝트 생성 모달 열기
 * - 프로젝트 생성 시 API 호출 (POST /api/projects)
 * - API 응답으로 배지 표시
 * - 배지 색상: creator(보라), member(노랑)
 * - 로딩 상태 표시
 * - 에러 처리
 */
export default function Calendar() {
  // URL 쿼리 파라미터 읽기 (프로젝트 삭제 후 돌아올 달 정보)
  const searchParams = useSearchParams();
  const paramYear = searchParams.get("year");
  const paramMonth = searchParams.get("month");

  // 초기 월 계산 (쿼리 파라미터가 있으면 그것 사용, 없으면 현재 월)
  const getInitialMonth = (): Date => {
    if (paramYear && paramMonth) {
      const year = parseInt(paramYear, 10);
      const month = parseInt(paramMonth, 10);
      if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
        return new Date(year, month - 1, 1);
      }
    }
    return new Date();
  };

  // 상태 관리
  const [currentMonth, setCurrentMonth] = useState<Date>(getInitialMonth());
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 캘린더 데이터 생성
  const calendarDates = getCalendarDates(currentMonth);
  const datesCellData = mapProjectsToDates(calendarDates, currentMonth, projects);

  /**
   * API에서 월별 프로젝트 조회
   * currentMonth가 변경될 때마다 자동으로 호출
   */
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      // Supabase 세션에서 토큰 가져오기
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // 로그인하지 않은 상태 - 빈 프로젝트 목록 표시
        setProjects([]);
        setError("");
        return;
      }

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1; // getMonth()는 0-11이므로 +1

      // Authorization 헤더에 토큰 포함
      const response = await fetch(`/api/projects?year=${year}&month=${month}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData?.error || "프로젝트 조회에 실패했습니다");
        } catch {
          throw new Error(`프로젝트 조회 실패: HTTP ${response.status}`);
        }
      }

      const data = await response.json();
      setProjects(data || []);
      setError("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "프로젝트 조회 중 오류가 발생했습니다";
      setError(errorMessage);
      console.error("프로젝트 조회 에러:", err);
      // toast는 선택사항 (자동 에러 표시)
    } finally {
      setLoading(false);
    }
  };

  /**
   * 초기 로드 및 월 변경 시 프로젝트 조회
   */
  useEffect(() => {
    fetchProjects();
  }, [currentMonth]);

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
   * 프로젝트 생성 완료 핸들러
   * CreateProjectModal에서 API 호출 완료 후 호출됨
   */
  const handleProjectCreated = () => {
    // 프로젝트 목록 재조회
    fetchProjects();
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
            disabled={loading}
            aria-label="이전 달"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            onClick={handleNextMonth}
            disabled={loading}
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
              currentMonth={currentMonth}
            />
          ))}
        </div>
      </div>

      {/* 로딩 상태 표시 */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">프로젝트를 불러오는 중...</span>
        </div>
      )}

      {/* 에러 상태 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 프로젝트 생성 모달 */}
      {selectedDate && (
        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDate(null);
          }}
          selectedDate={selectedDate}
          onProjectCreated={handleProjectCreated}
        />
      )}

      {/* 프로젝트 통계 */}
      {!loading && (
        <div className="border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600">총 {projects.length}개 프로젝트</p>
        </div>
      )}
    </div>
  );
}

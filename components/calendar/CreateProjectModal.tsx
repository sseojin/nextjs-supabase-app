"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onCreateProject: (title: string, date: Date) => void;
}

/**
 * 프로젝트 생성 모달 컴포넌트
 * shadcn/ui Dialog 기반
 *
 * 기능:
 * - 선택된 날짜 표시 (읽기 전용)
 * - 프로젝트 제목 입력
 * - 입력값 검증 (최소 2자)
 * - Enter 키로 제출
 * - 생성/취소 버튼
 *
 * 모바일 최적화:
 * - 높이: 자동 (70-80%)
 * - 입력 필드: 48px (폰트 16px로 모바일 줌 방지)
 * - 버튼: 44px 높이
 */
export default function CreateProjectModal({
  isOpen,
  onClose,
  selectedDate,
  onCreateProject,
}: CreateProjectModalProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  /**
   * 입력값 검증 및 프로젝트 생성
   * 최소 2자 이상이어야 함
   */
  const handleCreate = () => {
    // 공백 제거 후 검증
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("프로젝트 제목을 입력하세요");
      return;
    }

    if (trimmedTitle.length < 2) {
      setError("프로젝트 제목은 2자 이상이어야 합니다");
      return;
    }

    // 프로젝트 생성
    if (selectedDate) {
      onCreateProject(trimmedTitle, selectedDate);
    }

    // 모달 초기화 및 닫기
    setTitle("");
    setError("");
  };

  /**
   * Enter 키 핸들러
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCreate();
    }
  };

  /**
   * 모달 닫기
   */
  const handleClose = () => {
    setTitle("");
    setError("");
    onClose();
  };

  // 날짜 포맷 (한국어): "2024년 2월 19일 (월)"
  const formattedDate = selectedDate
    ? format(selectedDate, "yyyy년 M월 d일 (EEEE)", { locale: ko })
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-sm p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl">프로젝트 생성</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* 날짜 표시 (읽기 전용) */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-slate-700">날짜</Label>
            <div className="h-12 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-base text-slate-600">{formattedDate}</span>
            </div>
          </div>

          {/* 제목 입력 필드 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-title" className="text-sm font-medium text-slate-700">
              프로젝트 제목
            </Label>
            <Input
              id="project-title"
              type="text"
              placeholder="프로젝트 제목을 입력하세요"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                // 입력 시 에러 초기화
                if (error) setError("");
              }}
              onKeyDown={handleKeyDown}
              className="h-12 text-base"
              autoFocus
            />

            {/* 에러 메시지 */}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* 버튼 그룹 */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1 h-11" onClick={handleClose}>
              취소
            </Button>
            <Button className="flex-1 h-11" onClick={handleCreate}>
              생성
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Copy, CheckCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onProjectCreated: () => void;
}

/**
 * 프로젝트 생성 모달 컴포넌트
 * shadcn/ui Dialog 기반
 *
 * 기능:
 * - 선택된 날짜 표시 (읽기 전용)
 * - 프로젝트 제목 입력
 * - 프로젝트 장소 입력 (선택사항, Phase 3에서 사용)
 * - API를 통한 프로젝트 생성 (POST /api/projects)
 * - nanoid로 공유 링크 자동 생성 (서버에서)
 * - 입력값 검증 (제목 최소 2자)
 * - Enter 키로 제출
 * - 생성/취소 버튼
 * - 로딩 상태 표시
 * - toast 알림 (성공/실패)
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
  onProjectCreated,
}: CreateProjectModalProps) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * 입력값 검증 및 API를 통한 프로젝트 생성
   * 제목 최소 2자 이상이어야 함
   * 공유 링크는 서버(API)에서 nanoid로 자동 생성
   */
  const handleCreate = async () => {
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

    if (!selectedDate) {
      setError("날짜가 선택되지 않았습니다");
      return;
    }

    // 로딩 상태 활성화
    setLoading(true);
    setError("");

    try {
      // Supabase 세션에서 토큰 가져오기
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
      }

      // API 호출: POST /api/projects
      // 로컬 타임존 기반으로 YYYY-MM-DD 문자열 생성 (toISOString은 UTC로 변환되어 날짜가 밀림)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: trimmedTitle,
          date: dateString,
          ...(location.trim() && { location: location.trim() }),
        }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData?.error || "프로젝트 생성에 실패했습니다");
        } catch {
          throw new Error(`프로젝트 생성 실패: HTTP ${response.status}`);
        }
      }

      const createdProject = await response.json();

      // 성공 알림
      toast.success("프로젝트가 생성되었습니다!");

      // 모달 초기화 및 닫기
      setTitle("");
      setLocation("");
      setShareLink("");
      setError("");
      setCopyStatus(false);
      onClose();

      // 상위 컴포넌트에 콜백 전달 (Calendar에서 프로젝트 목록 재조회)
      onProjectCreated();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "프로젝트 생성 중 오류가 발생했습니다";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("프로젝트 생성 에러:", err);
    } finally {
      setLoading(false);
    }
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
   * 공유 링크를 클립보드에 복사
   * Phase 2: 공유 링크 기능 구현 예정
   * 현재는 비활성화 (프로젝트 생성 후에만 사용 가능)
   */
  const handleCopyShareLink = async () => {
    // Phase 2에서 구현: 프로젝트 생성 후 공유 링크를 표시하고 복사 가능하게 함
    setError("공유 링크 기능은 Phase 2에서 구현될 예정입니다");
    toast.info("공유 링크는 프로젝트 생성 후 사용 가능합니다");
  };

  /**
   * 모달 닫기
   */
  const handleClose = () => {
    setTitle("");
    setLocation("");
    setShareLink("");
    setError("");
    setCopyStatus(false);
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

          {/* 장소 입력 필드 */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-location" className="text-sm font-medium text-slate-700">
              장소
            </Label>
            <Input
              id="project-location"
              type="text"
              placeholder="만날 장소를 입력하세요"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
              }}
              className="h-12 text-base"
            />
          </div>

          {/* 공유 링크 섹션 */}
          <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <Label className="text-sm font-medium text-slate-700">공유 링크</Label>
            <Button
              variant="outline"
              onClick={handleCopyShareLink}
              className="h-11 flex gap-2 justify-center items-center text-base font-medium"
            >
              {copyStatus ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  공유 링크 복사
                </>
              )}
            </Button>
            {shareLink && (
              <p className="text-xs text-slate-600 text-center">
                링크: {shareLink}
              </p>
            )}
          </div>

          {/* 버튼 그룹 */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={handleClose}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                "생성"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

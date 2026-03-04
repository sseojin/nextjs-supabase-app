"use client";

import { useState, useEffect } from "react";
import { Loader2, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { AddLocationModalProps, AddLocationData } from "@/lib/types/location";

/**
 * 후보지 등록 모달 컴포넌트
 * 선택된 장소를 프로젝트의 후보지로 등록합니다.
 * 카테고리 선택, 메모 입력, 이미지 미리보기 기능 포함
 */
export default function AddLocationModal({
  isOpen,
  location,
  onClose,
  onSubmit,
}: AddLocationModalProps) {
  const [category, setCategory] = useState("카페");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  /**
   * 모달 열릴 때 폼 상태 초기화
   * isOpen 상태가 변경될 때마다 실행
   */
  useEffect(() => {
    if (isOpen) {
      setCategory("카페");
      setMemo("");
      setError("");
    }
  }, [isOpen]);

  /**
   * 폼 제출 핸들러
   * 1단계: 카테고리 유효성 검증
   * 2단계: AddLocationData 객체 생성
   * 3단계: onSubmit 콜백 호출
   * 4단계: 성공 시 토스트 + 모달 닫기
   */
  const handleSubmit = async () => {
    try {
      setError("");

      // 1단계: 카테고리 유효성 검증
      if (!category) {
        setError("카테고리를 선택해주세요");
        return;
      }

      if (!location) {
        setError("선택된 장소가 없습니다");
        return;
      }

      // 2단계: AddLocationData 객체 생성
      // x/y 좌표를 longitude/latitude로 변환 (10000000으로 나누기)
      const addLocationData: AddLocationData = {
        name: location.title,
        address: location.address,
        roadAddress: location.roadAddress,
        latitude: parseFloat(location.y) / 10000000,
        longitude: parseFloat(location.x) / 10000000,
        telephone: location.telephone,
        naver_link: location.naverMapLink,
        naver_images: location.images,
        category,
        memo: memo.trim() || undefined,
      };

      setIsSubmitting(true);

      // 3단계: onSubmit 콜백 호출
      await onSubmit(addLocationData);

      // 4단계: 성공 시 토스트 + 모달 닫기
      toast.success("후보지가 등록되었습니다");
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "등록 중 오류가 발생했습니다";
      setError(errorMessage);
      console.error("후보지 등록 에러:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>후보지 등록</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* 사진 미리보기 */}
          {location && (
            <div className="rounded-lg bg-slate-100 h-32 flex items-center justify-center overflow-hidden">
              {location.images && location.images.length > 0 ? (
                <img
                  src={location.images[0]}
                  alt={location.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-slate-300 mb-1" />
                  <p className="text-xs text-slate-400">사진 없음</p>
                </div>
              )}
            </div>
          )}

          {/* 읽기 전용 정보 (이름, 주소, 전화번호) */}
          {location && (
            <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">장소명</label>
                <p className="text-sm text-slate-900 font-medium">{location.title}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">주소</label>
                <p className="text-xs text-slate-700">{location.roadAddress || location.address}</p>
              </div>

              {location.telephone && (
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">전화번호</label>
                  <p className="text-xs text-slate-700">{location.telephone}</p>
                </div>
              )}
            </div>
          )}

          {/* 카테고리 선택 (Radio Button) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900 block">카테고리 *</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="restaurant"
                  name="category"
                  value="식당"
                  checked={category === "식당"}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="restaurant" className="text-sm font-normal cursor-pointer">
                  식당
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="cafe"
                  name="category"
                  value="카페"
                  checked={category === "카페"}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="cafe" className="text-sm font-normal cursor-pointer">
                  카페
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="other"
                  name="category"
                  value="기타"
                  checked={category === "기타"}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="other" className="text-sm font-normal cursor-pointer">
                  기타
                </Label>
              </div>
            </div>
          </div>

          {/* 메모 입력 (Textarea) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-900">메모</label>
              <span className="text-xs text-slate-600">{memo.length}/200자</span>
            </div>
            <Textarea
              placeholder="이 장소에 대한 메모를 입력하세요 (선택사항)"
              value={memo}
              onChange={(e) => setMemo(e.target.value.slice(0, 200))}
              maxLength={200}
              className="resize-none h-20"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <DialogFooter className="px-6 py-4 border-t border-slate-200 gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="sm:order-2"
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="sm:order-3">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                등록 중...
              </>
            ) : (
              "등록"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

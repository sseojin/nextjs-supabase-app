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
/**
 * 유틸리티 함수: cn으로 클래스 병합
 */
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

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
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [roadAddress, setRoadAddress] = useState("");
  const [telephone, setTelephone] = useState("");

  /**
   * 모달 열릴 때 폼 상태 초기화
   * isOpen 상태가 변경될 때마다 실행
   * 직접 클릭인지 검색 결과인지에 따라 다르게 초기화
   */
  useEffect(() => {
    if (isOpen && location) {
      // 직접 클릭 여부 확인
      const isManualClick = location.isManualClick === true;

      if (isManualClick) {
        // 직접 클릭: Reverse Geocoding 결과를 기본값으로 설정 (수정 가능)
        setName("");
        setAddress(location.address || "");
        setRoadAddress(location.roadAddress || "");
        setTelephone("");
      } else {
        // 검색 결과: 모든 정보를 읽기 전용으로 설정
        setName(location.title);
        setAddress(location.address);
        setRoadAddress(location.roadAddress);
        setTelephone(location.telephone || "");
      }

      setCategory("카페");
      setMemo("");
      setError("");
    }
  }, [isOpen, location]);

  /**
   * 폼 제출 핸들러
   * 1단계: 유효성 검증 (카테고리, 장소명)
   * 2단계: AddLocationData 객체 생성
   * 3단계: onSubmit 콜백 호출
   * 4단계: 성공 시 토스트 + 모달 닫기
   */
  const handleSubmit = async () => {
    try {
      setError("");

      // 1단계: 유효성 검증
      if (!category) {
        setError("카테고리를 선택해주세요");
        return;
      }

      if (!location) {
        setError("선택된 장소가 없습니다");
        return;
      }

      // 직접 클릭 여부 확인
      const isManualClick = location.isManualClick === true;

      // 직접 클릭 시 장소명 필수
      if (isManualClick && !name.trim()) {
        setError("장소명을 입력해주세요");
        return;
      }

      // 2단계: AddLocationData 객체 생성
      // x/y 좌표를 longitude/latitude로 변환 (10000000으로 나누기)
      const addLocationData: AddLocationData = {
        name: isManualClick ? name.trim() : location.title,
        address: isManualClick ? address.trim() : location.address,
        roadAddress: isManualClick ? roadAddress.trim() : location.roadAddress,
        latitude: parseFloat(location.y) / 10000000,
        longitude: parseFloat(location.x) / 10000000,
        telephone: isManualClick ? telephone.trim() || undefined : location.telephone,
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
                // eslint-disable-next-line @next/next/no-img-element
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
                  <p className="text-xs text-slate-400">
                    {location.isManualClick ? "직접 선택" : "사진 없음"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 조건부 입력 필드 */}
          {location &&
            (() => {
              const isManualClick = location.isManualClick === true;

              return (
                <div className="space-y-3">
                  {/* 장소명 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900 block">
                      장소명 {isManualClick && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isManualClick}
                      required={isManualClick}
                      placeholder={isManualClick ? "장소명을 입력하세요" : ""}
                      className={cn(
                        "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm",
                        !isManualClick && "bg-slate-50 cursor-not-allowed",
                      )}
                    />
                  </div>

                  {/* 도로명주소 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900 block">도로명주소</label>
                    <input
                      type="text"
                      value={roadAddress}
                      onChange={(e) => setRoadAddress(e.target.value)}
                      disabled={!isManualClick}
                      placeholder={isManualClick ? "도로명주소를 입력하세요 (선택)" : ""}
                      className={cn(
                        "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm",
                        !isManualClick && "bg-slate-50 cursor-not-allowed",
                      )}
                    />
                  </div>

                  {/* 지번주소 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900 block">지번주소</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={!isManualClick}
                      placeholder={isManualClick ? "지번주소를 입력하세요 (선택)" : ""}
                      className={cn(
                        "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm",
                        !isManualClick && "bg-slate-50 cursor-not-allowed",
                      )}
                    />
                  </div>

                  {/* 전화번호 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-900 block">전화번호</label>
                    <input
                      type="text"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      disabled={!isManualClick}
                      placeholder={isManualClick ? "전화번호를 입력하세요 (선택)" : ""}
                      className={cn(
                        "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm",
                        !isManualClick && "bg-slate-50 cursor-not-allowed",
                      )}
                    />
                  </div>

                  {/* 안내 메시지 (직접 클릭 시만 표시) */}
                  {isManualClick && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-700">
                        ⚠️ 직접 선택한 위치입니다. 장소명은 필수로 입력해주세요.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

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

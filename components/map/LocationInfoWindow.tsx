"use client";

import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LocationInfoWindowProps } from "@/lib/types/location";

/**
 * 지도에 표시되는 장소 정보 윈도우 컴포넌트
 * 선택된 장소의 사진, 이름, 주소, 액션 버튼을 표시합니다.
 * Pure presentational component - 상태 관리 없음
 */
export default function LocationInfoWindow({
  location,
  onAddLocation,
  onOpenNaverMap,
}: LocationInfoWindowProps) {
  /**
   * 이미지 로드 실패 시 처리
   */
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
  };

  return (
    <div className="w-72 bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
      {/* 사진 미리보기 또는 플레이스홀더 */}
      <div className="relative w-full h-32 bg-slate-100 flex items-center justify-center overflow-hidden">
        {location.images && location.images.length > 0 ? (
          <img
            src={location.images[0]}
            alt={location.title}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : null}

        {/* 사진이 없거나 로드 실패한 경우 플레이스홀더 */}
        {!location.images || location.images.length === 0 ? (
          <div className="flex flex-col items-center justify-center">
            <ImageIcon className="h-12 w-12 text-slate-300 mb-2" />
            <p className="text-xs text-slate-400">사진 없음</p>
          </div>
        ) : null}
      </div>

      {/* 장소 정보 */}
      <div className="p-3 space-y-2 border-b border-slate-200">
        <h4 className="text-base font-semibold text-slate-900 line-clamp-2">{location.title}</h4>
        <p className="text-xs text-slate-600 line-clamp-2">
          {location.roadAddress || location.address}
        </p>

        {/* 전화번호 */}
        {location.telephone && (
          <p className="text-xs text-slate-600">
            <span className="font-medium">전화:</span> {location.telephone}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="p-3 space-y-2">
        <Button variant="outline" size="sm" onClick={onOpenNaverMap} className="w-full text-xs h-9">
          네이버 지도 보기
        </Button>
        <Button size="sm" onClick={onAddLocation} className="w-full text-xs h-9">
          후보지 등록
        </Button>
      </div>
    </div>
  );
}

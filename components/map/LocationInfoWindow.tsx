"use client";

import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LocationInfoWindowProps } from "@/lib/types/location";

/**
 * 지도에 표시되는 장소 정보 윈도우 컴포넌트
 * 선택된 장소의 사진, 이름, 주소, 액션 버튼을 표시합니다.
 * 직접 클릭과 검색 결과에 따라 다른 UI를 표시합니다.
 * Pure presentational component - 상태 관리 없음
 */
export default function LocationInfoWindow({
  location,
  onAddLocation,
  onOpenNaverMap,
}: LocationInfoWindowProps) {
  // 직접 클릭 여부 확인
  const isManualClick = location.isManualClick === true;

  /**
   * 이미지 로드 실패 시 처리
   */
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
  };

  return (
    <div className="w-36 bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
      {/* 사진 미리보기 또는 플레이스홀더 */}
      <div className="relative w-full h-16 bg-slate-100 flex items-center justify-center overflow-hidden">
        {!isManualClick && location.images && location.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={location.images[0]}
            alt={location.title}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : null}

        {/* 사진이 없거나 로드 실패한 경우 플레이스홀더 */}
        {!isManualClick && (!location.images || location.images.length === 0) ? (
          <div className="flex flex-col items-center justify-center">
            <ImageIcon className="h-6 w-6 text-slate-300 mb-1" />
            <p className="text-xs text-slate-400">사진 없음</p>
          </div>
        ) : null}

        {/* 직접 클릭 안내 */}
        {isManualClick ? (
          <div className="flex flex-col items-center justify-center">
            <ImageIcon className="h-6 w-6 text-amber-400 mb-1" />
            <p className="text-xs text-amber-600">직접 선택</p>
          </div>
        ) : null}
      </div>

      {/* 장소 정보 */}
      <div className="p-2 space-y-1 border-b border-slate-200">
        <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">
          {location.title || "선택한 위치"}
        </h4>

        {/* 주소 표시 */}
        {location.roadAddress || location.address ? (
          <p className="text-xs text-slate-600 line-clamp-2">
            {location.roadAddress || location.address}
          </p>
        ) : (
          <p className="text-xs text-slate-400 line-clamp-2">주소 정보 없음</p>
        )}

        {/* 전화번호 (직접 클릭 시 숨김) */}
        {!isManualClick && location.telephone && (
          <p className="text-xs text-slate-600 line-clamp-1">
            <span className="font-medium">전화:</span> {location.telephone}
          </p>
        )}

        {/* 직접 클릭 안내 메시지 */}
        {isManualClick && (
          <p className="text-xs text-amber-600 line-clamp-2">
            ⚠️ 추가 정보는 등록 시 직접 입력해주세요
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="p-2 space-y-1">
        <Button variant="outline" size="sm" onClick={onOpenNaverMap} className="w-full text-xs h-8">
          네이버 지도 보기
        </Button>
        <Button size="sm" onClick={onAddLocation} className="w-full text-xs h-8">
          후보지 등록
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LocationSearchProps, LocationSearchResult } from "@/lib/types/location";

/**
 * 네이버 지도 장소 검색 컴포넌트
 * 사용자 입력을 받아 검색어로 장소를 검색하고 결과를 부모 컴포넌트로 전달합니다.
 * Enter 키 또는 검색 버튼으로 검색 실행
 */
export default function LocationSearch({
  onSearchResults,
  onSelectLocation,
  onCloseResults,
  showResults = true,
  userRole = "member",
  className,
}: LocationSearchProps & {
  showResults?: boolean;
  onCloseResults?: () => void;
  userRole?: "creator" | "member";
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [searchAttempted, setSearchAttempted] = useState(false);

  /**
   * 검색 실행 함수
   * 1단계: 검색어 유효성 검증 (2자 이상)
   * 2단계: API 호출 (/api/naver-map/search)
   * 3단계: 검색 결과 저장 및 부모로 전달
   * 4단계: 에러 처리 및 토스트 알림
   */
  const handleSearch = async () => {
    // 1단계: 검색어 유효성 검증
    if (!searchQuery.trim()) {
      toast.error("검색어를 입력해주세요");
      return;
    }

    if (searchQuery.trim().length < 2) {
      toast.error("검색어는 2자 이상이어야 합니다");
      return;
    }

    try {
      setIsSearching(true);
      setSearchAttempted(true);

      // 2단계: API 호출
      const response = await fetch(
        `/api/naver-map/search?query=${encodeURIComponent(searchQuery.trim())}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "검색 중 오류가 발생했습니다");
      }

      const data = await response.json();

      // 3단계: 검색 결과 저장 및 부모로 전달
      const searchResults = data.results || [];
      setResults(searchResults);
      onSearchResults(searchResults);

      // 검색 결과 알림
      if (searchResults.length === 0) {
        toast.info("검색 결과가 없습니다");
      } else {
        toast.success(`${searchResults.length}개의 장소를 �았습니다`);
      }
    } catch (error) {
      // 4단계: 에러 처리
      const errorMessage = error instanceof Error ? error.message : "검색 중 오류가 발생했습니다";
      console.error("장소 검색 에러:", error);
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Enter 키 입력 시 검색 실행
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isSearching) {
      handleSearch();
    }
  };

  /**
   * 검색 결과 항목 선택 시
   * 부모 콜백 호출 (결과 목록은 유지)
   */
  const handleSelectResult = (result: LocationSearchResult) => {
    onSelectLocation?.(result);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* 검색 입력 영역 */}
      <div className="flex gap-2">
        <Input
          placeholder="카페, 식당 등 장소를 검색하세요"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSearching}
          className="flex-1 h-12 text-base"
        />
        <Button onClick={handleSearch} disabled={isSearching} className="px-4 min-w-max">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 검색 결과 목록 또는 비어있음 메시지 */}
      {searchAttempted && showResults && (
        <>
          {results.length > 0 ? (
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  검색 결과 ({results.length}개)
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onCloseResults?.();
                  }}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                  aria-label="검색 결과 닫기"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
              <div className="space-y-2">
                {results.map((result, index) => {
                  // 사용자 역할에 따라 배지 색상 결정
                  const badgeColor = userRole === "creator" ? "bg-red-600" : "bg-blue-600";
                  const hoverBgColor =
                    userRole === "creator" ? "hover:bg-red-50" : "hover:bg-blue-50";
                  const activeBgColor =
                    userRole === "creator" ? "active:bg-red-100" : "active:bg-blue-100";

                  return (
                    <button
                      key={`${result.title}-${result.x}-${result.y}`}
                      onClick={() => handleSelectResult(result)}
                      className={`w-full flex gap-3 items-start p-3 rounded-md ${hoverBgColor} ${activeBgColor} transition-colors text-left`}
                    >
                      {/* 번호 배지 */}
                      <div
                        className={`flex-shrink-0 flex items-center justify-center w-6 h-6 ${badgeColor} text-white rounded-full text-xs font-semibold`}
                      >
                        {index + 1}
                      </div>

                      {/* 장소 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {result.title}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {result.roadAddress || result.address}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-semibold text-slate-700 mb-1">검색 결과가 없습니다</p>
              <p className="text-xs text-slate-600">다른 검색어로 다시 시도해주세요</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

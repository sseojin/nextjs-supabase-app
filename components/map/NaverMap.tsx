"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Map } from "lucide-react";
import { cn } from "@/lib/utils";
import LocationInfoWindow from "./LocationInfoWindow";
import type { NaverMapProps } from "@/lib/types/location";
import type { CandidateWithUserVote } from "@/lib/types/candidate";
import { sortCandidatesByCategory } from "@/lib/utils/candidates";

interface NaverMapExtendedProps extends NaverMapProps {
  candidates?: CandidateWithUserVote[];
  focusCoordinates?: { lat: number; lng: number } | null;
}

/**
 * 네이버 지도 컴포넌트
 * Naver Maps API를 사용하여 지도를 렌더링하고 마커를 관리합니다.
 * 검색 결과를 마커로 표시하고, 선택된 장소를 InfoWindow로 표시합니다.
 * 사용자의 역할(생성자/참여자)에 따라 마커 색상을 다르게 표시합니다.
 * - 생성자: 보라색 마커 (purple-600)
 * - 멤버: 노란색 마커 (yellow-500)
 * Phase 4: 최종 선택된 후보지만 초록 마커로 표시
 * - 찬성 >= 66%: 초록 마커 표시 (#10B981)
 * - 찬성 < 66%: 마커 미표시 (지도에서 제거)
 */
export default function NaverMap({
  searchResults,
  selectedLocation,
  onLocationSelect,
  onAddLocation,
  userRole = "member",
  className,
  candidates,
  focusCoordinates,
}: NaverMapExtendedProps) {
  const mapRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const candidateMarkersRef = useRef<naver.maps.Marker[]>([]);
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const infoWindowContainerRef = useRef<HTMLDivElement | null>(null);

  /**
   * 1단계: 지도 초기화
   * Naver Maps API를 사용하여 지도 객체 생성
   * 기본 중심: 서울 시청 (37.5665, 126.9780)
   * 기본 줌 레벨: 13
   * 네이버 지도 API가 로드될 때까지 대기
   */
  useEffect(() => {
    if (!mapContainerRef.current) {
      console.error("지도 컨테이너를 찾을 수 없습니다");
      return;
    }

    // Naver Maps API 로드 대기 함수
    const initializeMap = () => {
      if (typeof window === "undefined" || !window.naver || !window.naver.maps) {
        console.warn("[NaverMap] Naver Maps API 로드 대기 중...");
        // 100ms 후 재시도
        setTimeout(initializeMap, 100);
        return;
      }

      // 지도 초기화
      try {
        const map = new window.naver.maps.Map(mapContainerRef.current!, {
          center: new window.naver.maps.LatLng(37.5665, 126.978), // 서울 시청
          zoom: 13,
          minZoom: 6,
          maxZoom: 20,
        });

        mapRef.current = map;

        // 지도 컨테이너의 클릭 이벤트 전파 방지
        mapContainerRef.current?.addEventListener("click", (e: Event) => {
          e.stopPropagation();
        });

        console.warn("[NaverMap] 지도 초기화 완료");
      } catch (error) {
        console.error("[NaverMap] 지도 초기화 실패:", error);
      }
    };

    // API 로드 상태 확인 및 초기화
    initializeMap();
  }, []);

  /**
   * 2단계: 검색 결과 마커 렌더링
   * 검색 결과가 변경될 때마다 마커를 업데이트합니다.
   * x/y 좌표를 10000000으로 나누어 위도/경도로 변환합니다.
   */
  useEffect(() => {
    if (!mapRef.current || !window.naver || !window.naver.maps) {
      return;
    }

    // 기존 마커 모두 제거
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    if (searchResults.length === 0) {
      return;
    }

    try {
      const bounds = new window.naver.maps.LatLngBounds();
      const markers: naver.maps.Marker[] = [];

      // 각 검색 결과마다 마커 생성
      searchResults.forEach((result, index) => {
        // x/y 좌표를 위도/경도로 변환 (10000000으로 나누기)
        const latitude = parseFloat(result.y) / 10000000;
        const longitude = parseFloat(result.x) / 10000000;
        const position = new window.naver.maps.LatLng(latitude, longitude);

        // 사용자 역할에 따라 마커 색상 결정
        // 생성자 = 보라(purple-600), 멤버 = 노랑(yellow-500)
        const markerColor = userRole === "creator" ? "bg-purple-600" : "bg-yellow-500";
        const textColor = userRole === "creator" ? "text-white" : "text-gray-900";

        // 마커 생성
        const marker = new window.naver.maps.Marker({
          position,
          map: mapRef.current,
          title: result.title,
          icon: {
            content: `
              <div class="flex items-center justify-center w-8 h-8 ${markerColor} ${textColor} rounded-full text-xs font-bold border-2 border-white shadow-lg">
                ${index + 1}
              </div>
            `,
            anchor: new window.naver.maps.Point(16, 16),
          },
        });

        // 마커 클릭 이벤트
        window.naver.maps.Event.addListener(marker, "click", () => {
          onLocationSelect(result);
        });

        markers.push(marker);
        bounds.extend(position);
      });

      // 모든 마커가 보이도록 지도 범위 조정
      mapRef.current.fitBounds(bounds);
      mapRef.current.panToBounds(bounds);

      markersRef.current = markers;
      console.warn(`[NaverMap] ${markers.length}개 마커 렌더링 완료 (역할: ${userRole})`);
    } catch (error) {
      console.error("[NaverMap] 마커 렌더링 실패:", error);
    }
  }, [searchResults, onLocationSelect, userRole]);

  /**
   * 3단계: InfoWindow 표시/숨김 및 지도 카메라 이동
   * selectedLocation이 변경될 때 InfoWindow를 업데이트하고 지도를 해당 위치로 이동합니다.
   */
  useEffect(() => {
    if (!mapRef.current || !window.naver || !window.naver.maps) {
      return;
    }

    // 기존 InfoWindow 제거
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    if (!selectedLocation) {
      return;
    }

    try {
      // 선택된 위치의 좌표 계산
      const latitude = parseFloat(selectedLocation.y) / 10000000;
      const longitude = parseFloat(selectedLocation.x) / 10000000;
      const markerPosition = new window.naver.maps.LatLng(latitude, longitude);

      // 지도 카메라를 선택된 위치로 이동
      mapRef.current.setCenter(markerPosition);
      mapRef.current.setZoom(18); // 상세 보기 줌 레벨

      console.warn("[NaverMap] 지도 이동 완료: lat=" + latitude + ", lng=" + longitude);

      // 선택된 마커 찾기 (InfoWindow 표시용)
      const selectedMarker = markersRef.current.find(
        (marker) =>
          marker.getTitle() === selectedLocation.title &&
          Math.abs((marker.getPosition() as naver.maps.LatLng).lat() - latitude) < 0.0001,
      );

      if (selectedMarker) {
        // InfoWindow를 위한 DOM 컨테이너 생성
        if (!infoWindowContainerRef.current) {
          infoWindowContainerRef.current = document.createElement("div");
        }

        // InfoWindow 생성
        const infoWindow = new window.naver.maps.InfoWindow({
          content: infoWindowContainerRef.current,
          position: markerPosition,
          maxWidth: 320,
          backgroundColor: "transparent",
          borderColor: "transparent",
          borderWidth: 0,
          anchorSize: new window.naver.maps.Size(0, 0),
        });

        infoWindow.open(mapRef.current, selectedMarker);
        infoWindowRef.current = infoWindow;

        console.warn("[NaverMap] InfoWindow 표시 완료:", selectedLocation.title);
      } else {
        console.warn("[NaverMap] 선택된 마커를 찾을 수 없습니다 (InfoWindow 미표시)");
      }
    } catch (error) {
      console.error("[NaverMap] 처리 실패:", error);
    }
  }, [selectedLocation]);

  /**
   * 4단계: 후보지 마커 렌더링 (Phase 4)
   * 최종 선택된 후보지만 초록색 마커로 표시합니다
   * - 찬성 >= 66%: 초록 마커 표시
   * - 찬성 < 66%: 마커 표시 안 함 (지도에서 제거)
   *
   * 마커 번호는 CandidateList와 일치하도록 카테고리별로 정렬한 순서를 사용합니다
   */
  useEffect(() => {
    if (!mapRef.current || !window.naver || !window.naver.maps) {
      return;
    }

    // 기존 후보지 마커 모두 제거
    candidateMarkersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    candidateMarkersRef.current = [];

    if (!candidates || candidates.length === 0) {
      return;
    }

    try {
      const markers: naver.maps.Marker[] = [];

      // 후보지를 카테고리별로 정렬 (CandidateList와 동일한 순서)
      const sortedCandidates = sortCandidatesByCategory(candidates);

      // 정렬된 후보지 배열을 순회하면서 찬성 >= 66%인 것만 마커로 표시
      // 정렬된 배열의 index를 사용하여 후보지 목록의 번호와 일치하도록 함
      sortedCandidates.forEach((candidate, index) => {
        const agreementRatio = candidate.agreement_ratio || 0;

        // 찬성 < 66%이면 마커 생성하지 않음
        if (agreementRatio < 66) {
          return;
        }

        const position = new window.naver.maps.LatLng(candidate.lat, candidate.lng);

        // 마커 생성 (초록색 + 정렬된 배열의 번호 표시)
        const marker = new window.naver.maps.Marker({
          position,
          map: mapRef.current,
          title: candidate.location_name,
          icon: {
            content: `
              <div class="flex items-center justify-center w-8 h-8 text-black rounded-full text-xs font-bold border-2 border-white shadow-lg cursor-pointer" style="background-color: #10B981;">
                ${index + 1}
              </div>
            `,
            anchor: new window.naver.maps.Point(16, 16),
          },
        });

        // 마커 클릭 시 네이버 지도로 이동
        // 장소명 검색 기반 네이버 지도 URL (LocationInfoWindow "네이버 지도 보기" 버튼과 동일)
        window.naver.maps.Event.addListener(marker, "click", () => {
          const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(candidate.location_name)}`;
          window.open(naverMapUrl, "_blank");
        });

        markers.push(marker);
      });

      candidateMarkersRef.current = markers;
      console.warn(
        `[NaverMap] ${markers.length}개 최종 선택 후보지 마커 렌더링 완료 (전체 ${candidates.length}개 중)`,
      );
    } catch (error) {
      console.error("[NaverMap] 후보지 마커 렌더링 실패:", error);
    }
  }, [candidates]);

  /**
   * 5단계: 후보지 카드 클릭 시 해당 위치로 지도 포커스
   * focusCoordinates가 변경되면 지도를 해당 위치로 이동하고 줌 레벨 설정
   */
  useEffect(() => {
    if (!mapRef.current || !window.naver || !window.naver.maps || !focusCoordinates) {
      return;
    }

    try {
      const position = new window.naver.maps.LatLng(focusCoordinates.lat, focusCoordinates.lng);

      // 지도 카메라를 해당 위치로 이동
      mapRef.current.setCenter(position);
      mapRef.current.setZoom(17); // 후보지 상세 보기 줌 레벨

      console.warn(
        "[NaverMap] 후보지 포커스 완료: lat=" +
          focusCoordinates.lat +
          ", lng=" +
          focusCoordinates.lng,
      );
    } catch (error) {
      console.error("[NaverMap] 포커스 이동 실패:", error);
    }
  }, [focusCoordinates]);

  /**
   * "네이버 지도 보기" 버튼 클릭 핸들러
   * 새 탭에서 네이버 지도 링크 열기
   */
  const handleOpenNaverMap = () => {
    if (selectedLocation?.naverMapLink) {
      window.open(selectedLocation.naverMapLink, "_blank");
    }
  };

  /**
   * "후보지 등록" 버튼 클릭 핸들러
   * 부모 컴포넌트로부터 받은 onAddLocation 콜백 호출
   */
  const handleAddLocation = () => {
    if (onAddLocation) {
      onAddLocation();
    }
  };

  /**
   * 네이버 지도 메인 페이지로 이동하는 핸들러
   * 우측 상단 버튼 클릭 시 호출됩니다
   */
  const handleGoToNaverMap = () => {
    window.open("https://map.naver.com/", "_blank");
  };

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* 지도 컨테이너 */}
      <div ref={mapContainerRef} id="navermap" className="w-full h-full rounded-lg" />

      {/* 네이버 지도로 이동 버튼 (우측 상단) */}
      <button
        onClick={handleGoToNaverMap}
        className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1.5 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-slate-200 text-xs font-medium text-slate-700 hover:text-slate-900 z-10"
        aria-label="네이버 지도로 이동"
      >
        <Map className="w-3.5 h-3.5" />
        <span>네이버 지도</span>
      </button>

      {/* InfoWindow 렌더링 (Portal 사용) */}
      {selectedLocation && infoWindowContainerRef.current
        ? createPortal(
            <LocationInfoWindow
              location={selectedLocation}
              onAddLocation={handleAddLocation}
              onOpenNaverMap={handleOpenNaverMap}
            />,
            infoWindowContainerRef.current,
          )
        : null}
    </div>
  );
}

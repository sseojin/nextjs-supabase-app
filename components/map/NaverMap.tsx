"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import LocationInfoWindow from "./LocationInfoWindow";
import type { NaverMapProps } from "@/lib/types/location";

/**
 * 네이버 지도 컴포넌트
 * Naver Maps API를 사용하여 지도를 렌더링하고 마커를 관리합니다.
 * 검색 결과를 마커로 표시하고, 선택된 장소를 InfoWindow로 표시합니다.
 */
export default function NaverMap({
  searchResults,
  selectedLocation,
  onLocationSelect,
  onAddLocation,
  className,
}: NaverMapProps) {
  const mapRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const infoWindowContainerRef = useRef<HTMLDivElement | null>(null);

  /**
   * 1단계: 지도 초기화
   * Naver Maps API를 사용하여 지도 객체 생성
   * 기본 중심: 서울 시청 (37.5665, 126.9780)
   * 기본 줌 레벨: 13
   */
  useEffect(() => {
    // Naver Maps API 로드 확인
    if (typeof window === "undefined" || !window.naver || !window.naver.maps) {
      console.error("Naver Maps API가 로드되지 않았습니다");
      return;
    }

    if (!mapContainerRef.current) {
      console.error("지도 컨테이너를 찾을 수 없습니다");
      return;
    }

    // 지도 초기화
    try {
      const map = new window.naver.maps.Map(mapContainerRef.current, {
        center: new window.naver.maps.LatLng(37.5665, 126.978), // 서울 시청
        zoom: 13,
        minZoom: 6,
        maxZoom: 20,
      });

      mapRef.current = map;
      console.warn("[NaverMap] 지도 초기화 완료");
    } catch (error) {
      console.error("[NaverMap] 지도 초기화 실패:", error);
    }
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

        // 마커 생성
        const marker = new window.naver.maps.Marker({
          position,
          map: mapRef.current,
          title: result.title,
          icon: {
            content: `
              <div class="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-xs font-bold border-2 border-white shadow-lg">
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
      console.warn(`[NaverMap] ${markers.length}개 마커 렌더링 완료`);
    } catch (error) {
      console.error("[NaverMap] 마커 렌더링 실패:", error);
    }
  }, [searchResults, onLocationSelect]);

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

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* 지도 컨테이너 */}
      <div ref={mapContainerRef} id="navermap" className="w-full h-full rounded-lg" />

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

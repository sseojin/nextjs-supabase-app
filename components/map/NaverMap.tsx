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
  const manualMarkerRef = useRef<naver.maps.Marker | null>(null); // 직접 클릭 마커 저장

  /**
   * 1단계: 지도 초기화
   * Naver Maps API를 사용하여 지도 객체 생성
   * 기본 중심: 서울 시청 (37.5665, 126.9780)
   * 기본 줌 레벨: 13
   *
   * naverMapsLoaded 이벤트를 리스닝하여 API 로드 완료 확인
   */
  useEffect(() => {
    // Naver Maps API 로드 대기
    const initializeMap = () => {
      // Naver Maps API 로드 확인
      if (typeof window === "undefined" || !window.naver || !window.naver.maps) {
        console.warn("[NaverMap] Naver Maps API 로드 대기 중...");
        // 200ms 후 다시 시도
        setTimeout(initializeMap, 200);
        return;
      }

      if (!mapContainerRef.current) {
        console.error("[NaverMap] 지도 컨테이너를 찾을 수 없습니다");
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
    };

    // 로드 완료 이벤트 리스너
    const handleNaverMapsLoaded = () => {
      console.warn("[NaverMap] naverMapsLoaded 이벤트 수신");
      initializeMap();
    };

    // 이미 로드된 경우 바로 초기화
    if (typeof window !== "undefined" && window.naver && window.naver.maps) {
      initializeMap();
    } else {
      // 로드 완료 이벤트 리스닝
      window.addEventListener("naverMapsLoaded", handleNaverMapsLoaded);

      // 폴링으로도 확인 (이벤트 미스 방지)
      const timer = setTimeout(initializeMap, 500);

      return () => {
        window.removeEventListener("naverMapsLoaded", handleNaverMapsLoaded);
        clearTimeout(timer);
      };
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
      // 선택된 마커 찾기
      const selectedMarker = markersRef.current.find(
        (marker) =>
          marker.getTitle() === selectedLocation.title &&
          Math.abs(
            (marker.getPosition() as naver.maps.LatLng).lat() -
              parseFloat(selectedLocation.y) / 10000000,
          ) < 0.0001,
      );

      if (!selectedMarker) {
        console.warn("[NaverMap] 선택된 마커를 찾을 수 없습니다");
        return;
      }

      // 지도 카메라를 선택된 위치로 이동
      const markerPosition = selectedMarker.getPosition() as naver.maps.LatLng;
      mapRef.current.setCenter(markerPosition);
      mapRef.current.setZoom(18); // 상세 보기 줌 레벨

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
    } catch (error) {
      console.error("[NaverMap] InfoWindow 표시 실패:", error);
    }
  }, [selectedLocation]);

  /**
   * 4단계: 지도 직접 클릭 이벤트
   * 사용자가 지도를 클릭하면 해당 좌표로 Reverse Geocoding을 수행하고
   * 직접 클릭 마커(빨간색)를 표시합니다.
   */

  useEffect(() => {
    if (!mapRef.current || !window.naver || !window.naver.maps) {
      return;
    }

    // 지도 클릭 이벤트 리스너
    const clickListener = window.naver.maps.Event.addListener(
      mapRef.current,
      "click",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (e: any) => {
        const clickedLatLng = e.coord as naver.maps.LatLng;
        const latitude = clickedLatLng.lat();
        const longitude = clickedLatLng.lng();

        console.warn(`[NaverMap] 지도 클릭: lat=${latitude}, lng=${longitude}`);
        await handleMapClick(latitude, longitude);
      },
    );

    // cleanup: 이벤트 리스너 제거
    return () => {
      window.naver.maps.Event.removeListener(clickListener);
    };
  }, []);

  /**
   * 지도 클릭 핸들러
   * 1. 기존 검색 마커 모두 제거 (사용자 선택사항)
   * 2. 기존 직접 클릭 마커 제거
   * 3. Reverse Geocoding API 호출
   * 4. 직접 클릭 마커 생성 (빨간색)
   * 5. LocationSearchResult 객체 생성
   * 6. 부모 컴포넌트로 전달 (InfoWindow 표시)
   */
  const handleMapClick = async (latitude: number, longitude: number) => {
    // 1단계: 기존 검색 마커 모두 제거
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // 2단계: 기존 직접 클릭 마커 제거
    if (manualMarkerRef.current) {
      manualMarkerRef.current.setMap(null);
      manualMarkerRef.current = null;
    }

    // 3단계: Reverse Geocoding API 호출
    let address = "";
    let roadAddress = "";

    try {
      const response = await fetch("/api/naver-map/reverse-geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });

      const data = await response.json();

      if (data.success) {
        address = data.address || "";
        roadAddress = data.roadAddress || "";
        console.warn(`[NaverMap] Reverse Geocoding 성공: ${roadAddress || address}`);
      } else {
        console.warn("[NaverMap] Reverse Geocoding 실패, 주소 없이 진행");
      }
    } catch (error) {
      console.error("[NaverMap] Reverse Geocoding 에러:", error);
    }

    // 4단계: 직접 클릭 마커 생성 (빨간색 핀)
    if (mapRef.current) {
      const position = new window.naver.maps.LatLng(latitude, longitude);

      const marker = new window.naver.maps.Marker({
        position,
        map: mapRef.current,
        title: "선택한 위치",
        icon: {
          content: `
            <div class="flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded-full border-2 border-white shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke-width="2" stroke="white" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
          `,
          anchor: new window.naver.maps.Point(16, 32),
        },
      });

      manualMarkerRef.current = marker;

      // 지도 카메라 이동
      mapRef.current.setCenter(position);
      mapRef.current.setZoom(18);
    }

    // 5단계: LocationSearchResult 객체 생성
    const clickedLocation = {
      title: "선택한 위치",
      address,
      roadAddress,
      x: String(longitude * 10000000), // 네이버 API 형식
      y: String(latitude * 10000000),
      telephone: undefined,
      link: undefined,
      naverMapLink: `https://map.naver.com/v5/search/${latitude},${longitude}`,
      category: undefined,
      images: null,
      isManualClick: true, // 🔑 직접 클릭 플래그
    };

    // 6단계: 부모 컴포넌트로 전달
    onLocationSelect(clickedLocation);
  };

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

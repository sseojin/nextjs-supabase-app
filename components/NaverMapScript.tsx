"use client";

import Script from "next/script";

/**
 * 네이버 지도 API 스크립트 로더
 * 클라이언트 컴포넌트로 환경 변수를 런타임에 읽어서 스크립트 로드
 */
export default function NaverMapScript() {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!clientId) {
    console.error("[NaverMapScript] NEXT_PUBLIC_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다");
    return null;
  }

  return (
    <Script
      strategy="afterInteractive"
      src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
      onReady={() => {
        console.log("[NaverMapScript] 네이버 지도 API 로드 완료");
        // 커스텀 이벤트 발생
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("naverMapsLoaded"));
        }
      }}
      onError={(e) => {
        console.error("[NaverMapScript] 네이버 지도 API 로드 실패:", e);
      }}
    />
  );
}

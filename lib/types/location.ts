/**
 * 네이버 지도 검색 결과 타입
 * Naver Local Search API에서 반환되는 장소 정보
 */
export interface LocationSearchResult {
  title: string;
  address: string;
  roadAddress: string;
  x: string; // 경도 (longitude)
  y: string; // 위도 (latitude)
  telephone?: string;
  link?: string; // 가게 공식 웹사이트
  naverMapLink: string; // 네이버 지도 링크 (필수)
  category?: string;
  images?: string[] | null; // 크롤링한 사진 URL 배열 또는 null
}

/**
 * 네이버 지도 검색 API 응답 타입
 */
export interface NaverMapSearchResponse {
  results: LocationSearchResult[];
}

/**
 * LocationInfoWindow 컴포넌트 Props
 */
export interface LocationInfoWindowProps {
  location: LocationSearchResult;
  onAddLocation: () => void;
  onOpenNaverMap: () => void;
}

/**
 * AddLocationModal 컴포넌트 Props
 */
export interface AddLocationModalProps {
  isOpen: boolean;
  location: LocationSearchResult | null;
  onClose: () => void;
  onSubmit: (data: AddLocationData) => void;
}

/**
 * 후보지 추가 시 전송되는 데이터
 * Phase 4에서 API POST에 사용됨
 */
export interface AddLocationData {
  name: string;
  address: string;
  roadAddress?: string;
  latitude: number;
  longitude: number;
  telephone?: string;
  naver_link?: string;
  naver_images?: string[] | null;
  category: string;
  memo?: string;
}

/**
 * Naver Map Marker 타입
 */
export interface NaverMapMarker {
  id?: string;
  title: string;
  lat: number;
  lng: number;
  color?: "red" | "blue" | "green" | "black"; // 🔴 🔵 🟢 ⚫
}

/**
 * NaverMap 컴포넌트 Props
 */
export interface NaverMapProps {
  searchResults: LocationSearchResult[];
  selectedLocation: LocationSearchResult | null;
  onLocationSelect: (location: LocationSearchResult | null) => void;
  onAddLocation?: () => void;
  className?: string;
}

/**
 * LocationSearch 컴포넌트 Props
 */
export interface LocationSearchProps {
  onSearchResults: (results: LocationSearchResult[]) => void;
  onSelectLocation?: (location: LocationSearchResult) => void;
  className?: string;
}

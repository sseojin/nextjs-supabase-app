import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents 기본값 사용 (Turbopack 호환성)
  // 인증 확인이 필요한 라우트는 서버 컴포넌트에서 직접 처리
};

export default nextConfig;

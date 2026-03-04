/**
 * 네이버 Reverse Geocoding API
 * 좌표(위도, 경도)를 받아 주소 정보를 반환합니다.
 *
 * POST /api/naver-map/reverse-geocode
 * Body: { latitude: number, longitude: number }
 * Response: { success: boolean, address?: string, roadAddress?: string }
 */

/**
 * Reverse Geocoding으로 좌표를 주소로 변환하는 함수
 * @param latitude - 위도
 * @param longitude - 경도
 * @returns { address, roadAddress } 또는 { address: '', roadAddress: '' }
 */
async function getReverseGeocodeAddress(
  latitude: number,
  longitude: number,
): Promise<{ address: string; roadAddress: string }> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  // 환경 변수 미설정 체크
  if (!clientId || !clientSecret) {
    console.warn("[ReverseGeocode] 환경변수 미설정: NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET");
    return { address: "", roadAddress: "" };
  }

  try {
    // 네이버 Reverse Geocoding API 호출
    const response = await fetch(
      `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${longitude},${latitude}&orders=roadaddr,addr`,
      {
        method: "GET",
        headers: {
          "X-NCP-APIGW-API-KEY-ID": clientId,
          "X-NCP-APIGW-API-KEY": clientSecret,
        },
      },
    );

    // 응답 처리
    if (!response.ok) {
      console.warn(`[ReverseGeocode] API 오류: ${response.status} ${response.statusText}`);
      return { address: "", roadAddress: "" };
    }

    const data = await response.json();

    // 결과 추출
    const results = data.results || [];
    if (results.length === 0) {
      console.warn(`[ReverseGeocode] 주소 정보 없음: lat=${latitude}, lng=${longitude}`);
      return { address: "", roadAddress: "" };
    }

    let address = "";
    let roadAddress = "";

    // results 배열에서 도로명주소(roadaddr)와 지번주소(addr) 추출
    for (const result of results) {
      if (result.name === "roadaddr" && !roadAddress) {
        roadAddress =
          result.region.area1.name +
          " " +
          result.region.area2.name +
          " " +
          result.region.area3.name;
        if (result.land) {
          roadAddress += " " + result.land.name;
        }
      }
      if (result.name === "addr" && !address) {
        address =
          result.region.area1.name +
          " " +
          result.region.area2.name +
          " " +
          result.region.area3.name;
        if (result.land) {
          address += " " + result.land.name;
        }
      }
    }

    console.warn(`[ReverseGeocode] 성공: roadAddr=${roadAddress}, addr=${address}`);
    return { address, roadAddress };
  } catch (error) {
    console.error("[ReverseGeocode] API 호출 오류:", error);
    return { address: "", roadAddress: "" };
  }
}

/**
 * POST 핸들러
 */
export async function POST(request: Request) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    const { latitude, longitude } = body;

    // 파라미터 검증
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return Response.json(
        { success: false, error: "latitude와 longitude는 number 타입이어야 합니다" },
        { status: 400 },
      );
    }

    // Reverse Geocoding 호출
    const { address, roadAddress } = await getReverseGeocodeAddress(latitude, longitude);

    return Response.json({
      success: true,
      address,
      roadAddress,
    });
  } catch (error) {
    console.error("[ReverseGeocode] 요청 처리 오류:", error);
    return Response.json(
      { success: false, error: "요청 처리 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

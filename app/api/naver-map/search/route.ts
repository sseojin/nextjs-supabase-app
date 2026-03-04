import * as cheerio from "cheerio";

/**
 * 네이버 Local Search API에서 반환하는 검색 결과 형태
 */
interface NaverSearchItem {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string; // 경도
  mapy: string; // 위도
}

/**
 * 최종 반환 형태
 */
interface LocationResult {
  title: string;
  address: string;
  roadAddress: string;
  x: string; // 경도
  y: string; // 위도
  telephone: string;
  link: string;
  naverMapLink: string; // 네이버 지도 링크 (필수)
  category: string;
  images: string[] | null;
}

const NAVER_SEARCH_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_SEARCH_CLIENT_ID;
const NAVER_SEARCH_CLIENT_SECRET = process.env.NAVER_SEARCH_SECRET;
const NAVER_SEARCH_API = "https://openapi.naver.com/v1/search/local.json";

/**
 * Naver Local Search API 호출
 * 기본 장소 정보 조회 (사진 제외)
 */
async function searchNaver(query: string): Promise<NaverSearchItem[]> {
  if (!NAVER_SEARCH_CLIENT_ID || !NAVER_SEARCH_CLIENT_SECRET) {
    throw new Error("Naver Search API 환경변수가 설정되지 않았습니다");
  }

  const response = await fetch(`${NAVER_SEARCH_API}?query=${encodeURIComponent(query)}&display=5`, {
    headers: {
      "X-Naver-Client-Id": NAVER_SEARCH_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_SEARCH_CLIENT_SECRET,
    },
  });

  if (!response.ok) {
    throw new Error(`Naver API error: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * 가게 공식 웹사이트에서 og:image 메타 태그를 크롤링하여 사진 추출
 * Cheerio를 사용한 HTML 파싱
 *
 * 크롤링 실패해도 에러 발생 안 함 (images: null 반환)
 */
async function getImagesFromOGTag(link: string): Promise<string[] | null> {
  // 링크가 없으면 스킵
  if (!link || link.trim() === "") {
    console.log("No website link provided");
    return null;
  }

  try {
    // 타임아웃 설정 (3초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const pageResponse = await fetch(link, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; bot/1.0)",
      },
    });

    clearTimeout(timeoutId);

    if (!pageResponse.ok) {
      console.warn(`Failed to fetch ${link}: ${pageResponse.status}`);
      return null;
    }

    const html = await pageResponse.text();
    const $ = cheerio.load(html);

    // og:image 메타 태그 추출
    const images: string[] = [];
    const seenUrls = new Set<string>(); // 중복 제거

    // og:image 메타 태그 찾기
    $('meta[property="og:image"]').each((_, el) => {
      const content = $(el).attr("content");
      if (content && !seenUrls.has(content)) {
        images.push(content);
        seenUrls.add(content);
      }
    });

    // 이미지가 없으면 null 반환
    if (images.length === 0) {
      console.log(`No og:image found for ${link}`);
      return null;
    }

    console.log(`Found ${images.length} og:image(s) for ${link}`);
    return images;
  } catch (error) {
    // 크롤링 실패해도 에러 로그만 출력 (아래로 계속 진행)
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Image crawling failed for ${link}: ${errorMessage}`);
    return null;
  }
}

/**
 * GET /api/naver-map/search
 *
 * 쿼리 파라미터: query (검색어)
 * 응답: { results: LocationResult[] }
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");

    if (!query || query.trim() === "") {
      return Response.json(
        { error: "query 파라미터가 필요합니다 (예: ?query=카페)" },
        { status: 400 },
      );
    }

    console.log(`[Naver Map Search] 검색어: ${query}`);

    // 1단계: Naver Local Search API 호출 (기본 정보)
    const naverItems = await searchNaver(query);

    if (naverItems.length === 0) {
      return Response.json({
        results: [],
        message: "검색 결과가 없습니다",
      });
    }

    console.log(`[Naver Map Search] ${naverItems.length}개 결과 획득`);

    // 2단계: 각 결과마다 사진 크롤링 및 네이버 지도 링크 생성 (병렬 처리)
    const resultsWithImages = await Promise.all(
      naverItems.map(async (item): Promise<LocationResult> => {
        // HTML 태그 제거 (네이버 API의 일부 응답에 HTML 태그가 포함될 수 있음)
        const cleanTitle = item.title.replace(/<[^>]*>/g, "");

        // 가게 공식 웹사이트에서 og:image 크롤링
        const images = await getImagesFromOGTag(item.link);

        // 네이버 지도 링크 생성 (좌표 기반)
        const naverMapLink = `https://map.naver.com/v5/search?query=${encodeURIComponent(cleanTitle)}&type=all&lang=ko`;

        return {
          title: cleanTitle,
          address: item.address,
          roadAddress: item.roadAddress,
          x: item.mapx, // 경도
          y: item.mapy, // 위도
          telephone: item.telephone,
          link: item.link,
          naverMapLink, // 네이버 지도 링크 (필수)
          category: item.category,
          images, // 사진 배열 또는 null
        };
      }),
    );

    console.log(
      `[Naver Map Search] 처리 완료: ${resultsWithImages.filter((r) => r.images).length}개 og:image 포함`,
    );

    return Response.json({ results: resultsWithImages });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Naver Map Search] 에러:", errorMessage);

    return Response.json(
      {
        error: "검색 중 오류가 발생했습니다",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}

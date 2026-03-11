# Realtime 연결 문제 디버깅 가이드

RLS 활성화 후에도 Realtime 연결 문제가 지속되는 경우 다음을 확인하세요.

## 1️⃣ 브라우저 콘솔 확인

개발자 도구 (F12) → Console 탭에서 다음 로그 확인:

### 정상 연결 시

```
[useRealtimeCandidates] Realtime 구독 시작: { projectId, channelName }
[useRealtimeCandidates] 구독 상태 변경: SUBSCRIBED
[useRealtimeCandidates] ✅ Realtime 연결 성공
```

### 연결 실패 시

```
[useRealtimeCandidates] ❌ Realtime 연결 실패
[useRealtimeCandidates] 에러 상세: {...}
[useRealtimeCandidates] 채널 이름: candidates-{projectId}
```

**에러 상세 내용을 확인하세요!** 가장 중요한 정보입니다.

---

## 2️⃣ 인증 상태 확인

### 브라우저 콘솔에서 실행:

```javascript
// Supabase 클라이언트 가져오기
const { createClient } = await import("./lib/supabase/client");
const supabase = createClient();

// 현재 세션 확인
const {
  data: { session },
} = await supabase.auth.getSession();
console.log("세션:", session);

// 사용자 정보 확인
const {
  data: { user },
} = await supabase.auth.getUser();
console.log("사용자:", user);
```

**결과:**

- `session`이 `null`이면 → 로그인 필요
- `user`가 `null`이면 → 인증 토큰 만료

---

## 3️⃣ Realtime 수동 테스트

### 브라우저 콘솔에서 실행:

```javascript
const { createClient } = await import("./lib/supabase/client");
const supabase = createClient();

// 현재 URL에서 projectId 추출
const pathParts = window.location.pathname.split("/");
const projectId = pathParts[pathParts.indexOf("projects") + 1];

// Realtime 채널 구독
const channel = supabase
  .channel(`test-candidates-${projectId}`)
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "candidates",
      filter: `project_id=eq.${projectId}`,
    },
    (payload) => {
      console.log("📡 Realtime 이벤트 수신:", payload);
    },
  )
  .subscribe((status, err) => {
    console.log("🔌 구독 상태:", status);
    if (err) console.error("🚨 에러:", err);
  });

// 5초 후 구독 해제
setTimeout(() => {
  channel.unsubscribe();
  console.log("✅ 테스트 완료");
}, 5000);
```

**기대 결과:**

- `🔌 구독 상태: SUBSCRIBED` 출력되면 성공
- `🔌 구독 상태: CHANNEL_ERROR` 출력되면 실패

---

## 4️⃣ 환경 변수 확인

### `.env.local` 파일 확인:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**주의:**

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`는 **anon key** (공개 키)여야 합니다
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 측에서만 사용 (절대 브라우저에서 사용 금지)

### 환경 변수 재확인:

1. `.env.local` 파일 수정
2. **개발 서버 재시작** (`npm run dev` 종료 후 재실행)
3. 브라우저 캐시 삭제 후 페이지 새로고침

---

## 5️⃣ Supabase 대시보드 확인

https://supabase.com/dashboard/project/[YOUR_PROJECT]

### 확인 사항:

1. **Database → Replication**
   - `candidates` 테이블: Source ✅
   - `candidate_votes` 테이블: Source ✅

2. **Database → Tables → candidates → RLS**
   - RLS enabled: ✅
   - Policies: `candidates_select_policy` 존재 확인

3. **Settings → API**
   - URL과 anon key가 `.env.local`과 일치하는지 확인

---

## 6️⃣ RLS 정책 수동 테스트

### SQL Editor에서 실행:

```sql
-- 현재 사용자 ID 확인
SELECT auth.uid();

-- candidates SELECT 정책 테스트
SELECT * FROM public.candidates
WHERE project_id IN (
  SELECT project_id FROM public.project_members
  WHERE user_id = auth.uid()
);

-- project_members SELECT 정책 테스트
SELECT * FROM public.project_members
WHERE user_id = auth.uid();
```

**결과:**

- 데이터가 조회되면 RLS 정책 정상
- 빈 결과가 나오면 RLS 정책 문제

---

## 7️⃣ 네트워크 탭 확인

개발자 도구 → Network 탭 → WS (WebSocket) 필터

### 확인 사항:

- `realtime` WebSocket 연결 상태 확인
- Status: `101 Switching Protocols` (정상)
- Status: `403 Forbidden` → RLS 정책 문제
- Status: `401 Unauthorized` → 인증 토큰 문제

---

## 8️⃣ 일반적인 해결 방법

### A. 세션 만료

**증상:** 로그인 후 시간이 지나면 Realtime 연결 실패

**해결:**

1. 로그아웃 후 다시 로그인
2. 또는 자동 세션 갱신 로직 추가:

```typescript
// lib/supabase/client.ts에 추가
export function createClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  // 세션 자동 갱신
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED") {
      console.log("🔄 세션 갱신됨");
    }
  });

  return supabase;
}
```

### B. 브라우저 확장 프로그램 충돌

**증상:** 특정 브라우저에서만 Realtime 연결 실패

**해결:**

1. 시크릿/프라이빗 모드에서 테스트
2. 광고 차단기, 프라이버시 확장 프로그램 비활성화

### C. CORS 문제

**증상:** 콘솔에 CORS 에러 출력

**해결:**

1. Supabase 대시보드 → Settings → API → CORS
2. 허용된 도메인에 `http://localhost:3000` 추가 (개발 환경)

### D. 방화벽/프록시 문제

**증상:** 회사 네트워크에서만 Realtime 연결 실패

**해결:**

1. WebSocket 연결 허용 확인
2. 다른 네트워크에서 테스트 (모바일 핫스팟 등)

---

## 9️⃣ 최후의 수단: Realtime 비활성화 및 Polling

Realtime이 계속 실패하면 Polling으로 대체:

```typescript
// lib/hooks/useRealtimeCandidates.ts 수정
useEffect(() => {
  fetchInitialData();

  // Realtime 대신 5초마다 폴링
  const interval = setInterval(() => {
    fetchInitialData(false); // 로딩 표시 없이 백그라운드 조회
  }, 5000);

  return () => clearInterval(interval);
}, [projectId]);
```

**단점:**

- 5초마다 API 호출 (서버 부하 증가)
- 실시간성 떨어짐 (최대 5초 지연)

**장점:**

- 안정적 동작 보장
- Realtime 설정 불필요

---

## 🆘 추가 도움이 필요하면

위 모든 단계를 시도했지만 문제가 해결되지 않으면:

1. **브라우저 콘솔의 전체 에러 메시지 캡처**
2. **Network 탭의 WebSocket 연결 상태 스크린샷**
3. **Supabase 대시보드의 Database Replication 스크린샷**

이 정보를 개발자에게 제공하세요.

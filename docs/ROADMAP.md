# Date Planner MVP - Development Roadmap

> 🚀 **총 개발 기간**: 2.5주 (17-18일)
> 📅 **목표**: 캘린더 기반 데이트 코스 협력 기획 앱 MVP 출시

---

## 📊 전체 로드맵 개요

```
Phase 0: 랜딩 + 캘린더 (2일) ✅ 완료
    ↓
Phase 1: 데이터베이스 + 프로젝트 생성 (2일) ✅ 완료
    ↓
Phase 2: 공유 링크 및 참여 (1일) ✅ 완료
    ↓
Phase 3: 네이버 지도 기본 구현 (2일) - 진행 예정
    ↓
Phase 4: 후보지 등록 및 투표 시스템 (3일)
    [사용자 색상 핀 마커 + 투표 + is_approved 상태 관리]
    ↓
Phase 5: Realtime 동기화 (후보지 + 투표) (1일)
    [지도/목록 실시간 업데이트, 마커 색상 변경 실시간 반영]
    ↓
Phase 6: 최종 장소 목록 및 타임테이블 준비 (1일)
    [확정된 장소 필터링, 다음 페이지(타임테이블)를 위한 API 준비]
    ↓
Phase 7: UI/UX 개선 및 전체 테스트 (2일)
```

---

# 📱 모바일 우선 디자인 철학

> 이 앱은 **모바일에서 주로 사용**되기 때문에 모든 기능과 UI/UX는 **모바일 우선(Mobile-First)** 접근으로 설계됩니다.

## 모바일 우선 설계 원칙

### 레이아웃 & 화면 구성
- [ ] **기본값: 모바일 (375px-480px)** - 모든 UI는 작은 화면부터 설계
- [ ] 수평 스크롤 최소화 - 수직 스크롤 중심의 단일 컬럼 레이아웃
- [ ] 터치 친화적 버튼 - 최소 44x44px 크기 (iOS 권장사항)
- [ ] 안전 여백(Safe Area) 고려 - 노치나 하단 인디케이터 주변 여백 확보
- [ ] 중요 콘텐츠는 위쪽에 배치 - 아래로 스크롤해야 보이는 콘텐츠 최소화

### 네비게이션
- [ ] **바텀 탭 네비게이션** - 친숙하고 접근하기 쉬운 위치
  - [ ] 캘린더 / 프로젝트 목록 / 프로필
  - [ ] 최대 4-5개 탭만 사용
- [ ] 헤더는 최소한으로 - 앱 제목과 필수 기능만 포함
- [ ] 뒤로가기 버튼 명확하게 배치

### 입력 & 상호작용
- [ ] 큰 입력 필드 - 텍스트 입력이 쉽고 오타가 적게
- [ ] 드롭다운보다 **선택지 버튼 또는 바텀 시트** 선호
- [ ] 모달은 전체 높이의 70-80% 사용 (스크롤 가능)
- [ ] 입력 완료 후 자동으로 키보드 닫기
- [ ] 오류 메시지는 입력 필드 바로 아래에 표시

### 지도 표시
- [ ] **지도 높이 조정** - 모바일에서는 50-60% 정도의 화면 사용
- [ ] 후보지 목록과 지도를 **수평 분할이 아닌 수직 분할** (스택 방식)
  - [ ] 위: 지도 (50%)
  - [ ] 아래: 후보지 목록 (50%, 스크롤 가능)
- [ ] 마커 클릭 시 Info Window 또는 바텀 시트로 표시
- [ ] 줌 버튼과 컨트롤은 접근하기 쉬운 위치에 배치

### 색상 & 타이포그래피
- [ ] 고대비 색상 사용 - 실외에서 햇빛 반사 상황에서도 잘 보이도록
- [ ] 최소 폰트 크기: 16px (모바일 기본 권장)
- [ ] 헤딩: 24px 이상 - 중요 정보는 크게
- [ ] 본문: 16-18px - 읽기 편함
- [ ] 라벨/헬퍼 텍스트: 14px

### 성능 & 로딩
- [ ] 지도 로딩 스피너 표시
- [ ] 이미지 최적화 (WebP, 적절한 크기)
- [ ] 번들 크기 최소화 - 모바일 네트워크 고려
- [ ] 오프라인 모드 고려 (기본 기능은 오프라인에서도 작동)

### 다크 모드 (선택사항)
- [ ] 시스템 설정에 따라 자동 전환
- [ ] 다크 모드에서도 가독성 보장

---

# 🎯 Phase 0: 랜딩 페이지 + 캘린더 구현 (2일)

## 준비 작업
- [x] `date-fns` 라이브러리 설치
- [x] 프로젝트 폴더 구조 생성 (components/landing, components/calendar 등)
- [x] 기본 TypeScript 타입 파일 생성 준비

## 랜딩 페이지 구현
- [x] `app/page.tsx` 생성
- [x] 웹 제목 (Date Planner) 및 로고 추가
- [x] 앱 설명 문구 작성 (1-2줄)
- [x] 로그인 버튼 구현 (→ `/auth/login`)
  - [x] 버튼 크기: 최소 44x44px (터치 친화적)
  - [x] 전체 너비 또는 충분한 가로 크기
- [x] 회원가입 버튼 구현 (→ `/auth/sign-up`)
  - [x] 로그인 버튼과 동일 크기
- [x] Tailwind CSS로 모바일 우선 레이아웃 적용
  - [x] 기본값: 모바일 (375px ~ 480px)
  - [x] 단일 컬럼, 수직 중심 정렬
  - [x] 적절한 패딩과 여백 (최소 16px)
- [x] 랜딩 페이지 스타일링 및 모바일에서 시각 확인

## 캘린더 메인 페이지 구현
- [x] `app/dashboard/page.tsx` 생성
- [x] 로그인 필요 확인 (미들웨어 활용)
- [x] `app/dashboard/layout.tsx` 생성 (대시보드 전용 레이아웃)

## 캘린더 컴포넌트 구현 (모바일 우선)
- [x] `components/calendar/Calendar.tsx` 생성
  - [x] 현재 월 표시 (예: "2024년 2월")
  - [x] 이전/다음 달 버튼 구현
    - [x] 버튼 크기: 최소 44x44px (터치 친화적)
  - [x] date-fns로 월 계산 로직 작성
  - [x] 7x6 날짜 그리드 렌더링
    - [x] 각 셀 최소 높이: 50px (터치 타겟 충분히 크게)
    - [x] 여백: 4-8px (셀 간 간격)
  - [x] 이전/다음 달 날짜 회색 처리
  - [x] 요일 헤더 (일~토) 렌더링
    - [x] 폰트 크기: 14px 이상

- [x] `components/calendar/DateCell.tsx` 생성
  - [x] 날짜 숫자 표시
    - [x] 폰트 크기: 16px 이상
  - [x] 프로젝트 배지 표시 영역 확보
    - [x] 배지 높이: 최소 24px
  - [x] 빈 날짜 클릭 가능하게 설정
  - [x] 프로젝트 배지 클릭 가능하게 설정
    - [x] 터치 피드백 (하이라이트 또는 스케일 효과)
  - [x] 활성 상태 시각적 표시 (배경색 변경)

- [x] `components/calendar/Calendar.tsx` 내부 프로젝트 배지 렌더링
  - [x] 빨간색 배지 스타일 (creator)
  - [x] 파란색 배지 스타일 (member)
  - [x] 배지에 프로젝트 제목 표시 (첫 8-10자, 모바일 폭 고려)
  - [x] 여러 프로젝트 시 최대 2개 표시, "+N" 처리
    - [x] 배지는 한 줄에 정렬되도록 (줄 바꿈 방지)

## 프로젝트 생성 모달 구현 (모바일 친화)
- [x] `components/calendar/CreateProjectModal.tsx` 생성
  - [x] 모달 기본 구조 (shadcn/ui Dialog 활용)
    - [x] 모바일: 전체 높이의 70-80% 사용 (스크롤 가능)
    - [x] 상단 드래그 바 제공 (모바일 UI 관례)
  - [x] 제목: "프로젝트 생성"
  - [x] 선택된 날짜 표시 (읽기 전용)
  - [x] 프로젝트 제목 입력 필드
    - [x] 최소 높이: 44px
    - [x] 폰트 크기: 16px 이상 (입력 시 줌 방지)
  - [x] 생성 및 취소 버튼
    - [x] 각 버튼: 최소 44x44px
    - [x] 버튼 사이 간격: 8px 이상
  - [x] 입력값 유효성 검사
    - [x] 오류 메시지는 입력 필드 아래에 표시
  - [x] 모달 열고 닫기 상태 관리

- [x] Calendar 컴포넌트에 모달 통합
  - [x] 빈 날짜 셀 클릭 시 모달 열기
  - [x] 날짜 정보를 모달에 전달

## 페이지 연동 테스트
- [x] 랜딩 페이지에서 로그인 버튼 클릭 → `/auth/login` 이동 확인
- [x] 로그인 후 자동으로 `/dashboard`로 이동 확인
- [x] 캘린더 페이지 렌더링 확인 (로컬 상태로 테스트 가능)
- [x] 월 이동 버튼 작동 확인 (로컬 상태로 테스트 가능)
- [x] 날짜 셀 클릭 → 모달 열기 확인 (로컬 상태로 테스트 가능)

---

# 🎯 Phase 1: 데이터베이스 + 프로젝트 생성 (2일)

## 데이터베이스 스키마 생성
- [x] `supabase/migrations/01_initial_schema.sql` 생성
- [x] `projects` 테이블 생성 (id, title, date, creator_id, share_link, status, created_at, updated_at)
- [x] `project_members` 테이블 생성
- [x] `locations` 테이블 생성
- [x] `votes` 테이블 생성
- [x] 각 테이블에 인덱스 추가
- [x] RLS (Row Level Security) 정책 작성
- [x] Realtime publication 설정
- [x] Supabase에 마이그레이션 실행 및 확인

## TypeScript 타입 정의
- [x] `lib/types/project.ts` 생성
  - [x] `Project` 타입 정의 (id, title, date, creator_id, share_link, status, created_at, updated_at)
  - [x] `ProjectMember` 타입 정의
  - [x] `ProjectWithMembers` 타입 정의

- [x] `lib/types/location.ts` 생성
  - [x] `Location` 타입 정의

- [x] `lib/types/vote.ts` 생성
  - [x] `Vote` 타입 정의

## 프로젝트 쿼리 함수 구현
- [x] `lib/supabase/queries/projects.ts` 생성
  - [x] `getProjectsByMonth(year, month)` - 월별 프로젝트 조회
  - [x] `getProjectById(projectId)` - 프로젝트 상세 조회
  - [x] `createProject(title, date)` - 프로젝트 생성
  - [x] `deleteProject(projectId)` - 프로젝트 삭제
  - [x] 에러 처리 추가

## 프로젝트 API 라우트 구현
- [x] `app/api/projects/route.ts` 생성
  - [x] `GET` 구현 (월별 프로젝트 목록 조회)
    - [x] 쿼리 파라미터: year, month
    - [x] 인증 확인
    - [x] 사용자가 참여한 프로젝트만 반환
  - [x] `POST` 구현 (프로젝트 생성)
    - [x] 요청 본문: title, date
    - [x] 공유 링크 자동 생성 (nanoid 사용)
    - [x] project_members에 creator 추가
    - [x] display_color 설정 (creator: #FF0000)

- [x] `app/api/projects/[projectId]/route.ts` 생성
  - [x] `GET` 구현 (프로젝트 상세 조회)
  - [x] `DELETE` 구현 (프로젝트 삭제, creator만 가능)

## 프로젝트 생성 모달 로직 연결
- [x] `components/calendar/CreateProjectModal.tsx`에 API 호출 추가
  - [x] 생성 버튼 클릭 시 `POST /api/projects` 호출
  - [x] 로딩 상태 표시
  - [x] 성공 시 모달 닫기 및 캘린더 새로고침
  - [x] 에러 시 토스트 알림 표시

## 캘린더에 프로젝트 배지 표시
- [x] Calendar 컴포넌트에서 `getProjectsByMonth` 호출
  - [x] 월별 프로젝트 데이터 조회
  - [x] 로딩 상태 처리
  - [x] 에러 처리

- [x] DateCell 컴포넌트에 프로젝트 배지 전달 및 렌더링
  - [x] 프로젝트 role 확인 (creator/member)
  - [x] 배지 색상 결정 (빨강/파랑)
  - [x] 프로젝트 제목 표시

## 프로젝트 배지 클릭 시 동작
- [x] DateCell에서 배지 클릭 시 `/projects/[projectId]`로 이동 구현
  - [x] Next.js router.push() 활용
  - [x] 프로젝트 ID 전달

## 기능 테스트
- [x] 모달에서 프로젝트 제목 입력 후 생성 버튼 클릭
- [x] Supabase에 프로젝트 데이터 저장 확인
- [x] 캘린더 새로고침 시 프로젝트 배지 표시 확인
- [x] 배지 색상 올바르게 표시 확인 (빨강/파랑)
- [x] 배지 클릭 → 프로젝트 상세 페이지 이동 확인

---

# 🎯 Phase 2: 공유 링크 생성 + 참여 (1일)

## 공유 링크 생성 및 저장
- [x] `lib/utils/shareLink.ts` 생성
  - [x] nanoid 라이브러리 import
  - [x] `generateShareLink()` 함수 구현 (10-12자 고유 링크 생성)

- [x] 프로젝트 생성 시 공유 링크 자동 생성
  - [x] API에서 nanoid로 링크 생성
  - [x] 링크를 projects 테이블에 저장

## 공유 링크 버튼 컴포넌트
- [x] `components/projects/ShareLinkButton.tsx` 생성
  - [x] 프로젝트 ID 받기
  - [x] 공유 링크 URL 구성 (`/join/[shareLink]`)
  - [x] 복사 버튼 구현 (react-copy-to-clipboard 또는 Clipboard API)
  - [x] 복사 성공 시 토스트 알림 표시

- [x] 프로젝트 상세 페이지에 버튼 추가

## 공유 링크 참여 페이지 구현
- [x] `app/join/[shareLink]/page.tsx` 생성
  - [x] 공유 링크 검증
  - [x] 프로젝트 존재 여부 확인
  - [x] 사용자 인증 확인 (미로그인 시 로그인 페이지로 리다이렉트)
  - [x] 이미 참여한 사용자 확인
  - [x] 프로젝트 멤버 수 확인 (2명 제한)

- [x] 참여 버튼 UI 구현
  - [x] 프로젝트 정보 표시 (제목, 날짜, 생성자)
  - [x] "참여하기" 버튼
  - [x] 에러 메시지 표시 (이미 참여함, 프로젝트 가득 참 등)

## 참여 API 라우트 구현
- [x] `app/api/projects/[projectId]/join/route.ts` 생성
  - [x] `POST` 구현 (프로젝트 참여)
  - [x] shareLink 검증
  - [x] 멤버 수 확인 (2명 제한)
  - [x] 이미 참여했는지 확인
  - [x] project_members 테이블에 member 추가
  - [x] display_color 설정 (member: #0000FF)

## 참여 로직 연결
- [x] 참여 버튼 클릭 → API 호출
  - [x] 로딩 상태 표시
  - [x] 성공 시 프로젝트 상세 페이지로 리다이렉트
  - [x] 실패 시 에러 메시지 표시

## 멤버 목록 표시
- [x] 프로젝트 상세 페이지에 현재 멤버 목록 표시
  - [x] API에서 project_members 조회
  - [x] 멤버 역할 표시 (creator/member)
  - [x] 멤버 색상 표시 (빨강/파랑)

## 기능 테스트
- [x] 프로젝트 생성 후 공유 링크 복사 가능 확인
- [x] 다른 계정에서 공유 링크 접속 확인
- [x] 참여하기 버튼 클릭 → project_members 저장 확인
- [x] 캘린더에서 참여한 프로젝트 파란 배지로 표시 확인
- [x] 2명 이상 참여 불가 확인 (에러 메시지 표시)
- [x] 이미 참여한 프로젝트 재참여 불가 확인

---

# 🎯 Phase 3: 네이버 지도 기본 구현 (2-3일)

## 네이버 지도 API 키 발급
- [ ] 네이버 클라우드 플랫폼 회원가입 (무료 체험판)
- [ ] Maps 애플리케이션 등록
- [ ] 웹 서비스 URL 등록 (localhost:3000, 배포 도메인)
- [ ] Client ID 및 Secret 발급받기
- [ ] `.env.local`에 환경 변수 추가
  ```env
  NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id
  NAVER_MAP_CLIENT_SECRET=your_client_secret
  ```

## 데이터베이스 스키마 추가 (locations, votes)
- [ ] `supabase/migrations/03_add_locations_votes_schema.sql` 생성
  - [ ] **locations 테이블**:
    - [ ] id (UUID, PK)
    - [ ] project_id (UUID, FK → projects)
    - [ ] added_by (UUID, FK → auth.users) - 후보지 추가한 사용자
    - [ ] name (TEXT) - 장소명
    - [ ] address (TEXT) - 주소 (도로명)
    - [ ] latitude (DECIMAL) - 위도
    - [ ] longitude (DECIMAL) - 경도
    - [ ] category (TEXT) - 카테고리 (카페, 식당, 영화관 등)
    - [ ] telephone (TEXT, nullable) - 전화번호
    - [ ] naver_link (TEXT, nullable) - 네이버 지도 링크
    - [ ] memo (TEXT, nullable) - 메모/설명
    - [ ] is_approved (BOOLEAN DEFAULT false) - 만장일치 여부
    - [ ] created_at, updated_at (TIMESTAMPTZ)
    - [ ] **image_urls (TEXT[] or JSON, nullable)** - 사용자가 업로드한 사진 URL 배열 (선택사항, Phase 4+ 구현)
  - [ ] **votes 테이블**:
    - [ ] id (UUID, PK)
    - [ ] location_id (UUID, FK → locations)
    - [ ] user_id (UUID, FK → auth.users)
    - [ ] vote (BOOLEAN) - true: 찬성, false: 반대
    - [ ] created_at, updated_at (TIMESTAMPTZ)
    - [ ] UNIQUE(location_id, user_id)
  - [ ] 인덱스 생성
  - [ ] RLS 정책 설정
  - [ ] Realtime publication 추가

## 네이버 지도 설정 파일 생성
- [ ] `lib/naver-map/config.ts` 생성
  - [ ] 네이버 지도 API URL 설정
  - [ ] 기본 지도 옵션 (중심, 줌 레벨 등)

- [ ] `lib/naver-map/types.ts` 생성
  - [ ] NaverLocation 타입 정의
  - [ ] 네이버 지도 관련 타입 정의

## 네이버 지도 스크립트 로드
- [ ] `app/projects/[projectId]/page.tsx` 생성
  - [ ] Next.js Script 컴포넌트로 네이버 지도 API 로드
  - [ ] 스크립트 로딩 완료 후 컴포넌트 렌더링

## 네이버 지도 메인 컴포넌트 구현
- [ ] `components/map/NaverMap.tsx` 생성 ("use client")
  - [ ] useRef로 지도 컨테이너 참조
  - [ ] useEffect에서 지도 초기화
  - [ ] 초기 중심 설정 (서울 시청: 37.5665, 126.9780)
  - [ ] 초기 줌 레벨 설정 (13)
  - [ ] 지도 컨테이너 JSX 렌더링 (width: 100%, height: 600px)

  - [ ] 줌 컨트롤 추가
  - [ ] 지도 타입 버튼 (일반, 위성, 지형)

## 지도 클릭 이벤트 구현
- [ ] NaverMap 컴포넌트에 클릭 이벤트 리스너 추가
  - [ ] window.naver.maps.Event.addListener('click')
  - [ ] 클릭 좌표 (위도/경도) 추출
  - [ ] 상위 컴포넌트에 콜백으로 전달

## Reverse Geocoding 구현
- [ ] 지도 클릭 시 좌표를 주소로 변환
  - [ ] window.naver.maps.Service.reverseGeocode() 호출
  - [ ] 검색 결과에서 주소 추출
  - [ ] 모달에 주소 표시

## 장소 검색 API 구현 (핵심 기능)
- [ ] `app/api/naver-map/search/route.ts` 생성
  - [ ] `GET` 구현 (장소 검색)
  - [ ] 쿼리 파라미터: query (가게명, "지역 카테고리" 형식)
  - [ ] 네이버 Local Search API 호출 (기본 정보만)
  - [ ] 검색 결과 반환 (정확도순):
    ```javascript
    {
      title: "스타벅스 명동중앙점",
      address: "서울 중구 명동길 50",
      roadAddress: "서울 중구 명동 50-1",
      x: "127.0123",      // 경도
      y: "37.5645",       // 위도
      telephone: "02-1234-5678",
      link: "https://map.naver.com/v5/search/...",
      category: "카페"
    }
    ```
  - [ ] 사진은 API에서 제공되지 않으므로 별도로 처리하지 않음
    - [ ] 사용자가 후보지 등록 시 원하면 직접 사진 업로드 가능

## 장소 검색 컴포넌트 구현
- [ ] `components/map/LocationSearch.tsx` 생성 ("use client")
  - [ ] **검색 입력 필드** (모바일 친화, 큼)
    - [ ] placeholder: "가게 이름, 지역+가게명 (예: 강남 스타벅스)"
    - [ ] 엔터 키 또는 검색 버튼으로 검색
  - [ ] **검색 결과 목록** (정확도순 표시)
    - [ ] 각 아이템: 가게명, 주소, 전화번호
    - [ ] 클릭 → 해당 가게 선택
  - [ ] **로딩/에러 상태 처리**
  - [ ] 결과 선택 시 콜백 호출 (상위 컴포넌트에 데이터 전달)

## 장소 상세 정보 InfoWindow 구현
- [ ] `components/map/LocationInfoWindow.tsx` 생성 ("use client")
  - [ ] **상단: 기본 정보**
    - [ ] 가게 이름 (큰 텍스트)
    - [ ] 주소 (도로명)
    - [ ] 전화번호 (모바일에서 tel: 링크)
  - [ ] **하단: 액션 버튼**
    - [ ] **"📷 네이버 지도에서 보기" (주요 CTA)**
      - [ ] 실시간 사진/후기/메뉴 확인 가능
      - [ ] 웹: window.open(link, '_blank')
      - [ ] 모바일: 네이버 지도 앱 프로토콜 또는 웹
    - [ ] **"➕ 후보지 등록" (보조 CTA)**
      - [ ] 클릭 → AddLocationModal 열기

## 후보지 추가 모달 구현
- [ ] `components/locations/AddLocationModal.tsx` 생성 ("use client")
  - [ ] 장소명 표시 (읽기 전용)
  - [ ] 주소 표시 (읽기 전용)
  - [ ] 위도/경도 표시 (읽기 전용)
  - [ ] 전화번호 표시 (읽기 전용)
  - [ ] 카테고리 선택 드롭다운 (카페, 식당, 영화관 등)
  - [ ] 메모 입력 필드 (선택사항)
  - [ ] "추가" 및 "취소" 버튼

## 프로젝트 상세 페이지 레이아웃
- [ ] `app/projects/[projectId]/page.tsx` 완성
  - [ ] **모바일 (기본)**: 상단 지도 (350px) → 하단 후보지 목록 (스크롤 가능)
  - [ ] **태블릿 세로**: 모바일과 동일 (상단 지도 350px → 하단 목록)
  - [ ] **태블릿 가로 (1024px)**: 좌측 지도 60% → 우측 목록 40%
  - [ ] **데스크톱 (1280px+)**: 좌측 지도 60-70% → 우측 후보지 목록 30-40%

- [ ] 우측/하단 패널 구현
  - [ ] 상단: 장소 검색 입력
  - [ ] 중간: 후보지 목록 표시 영역
  - [ ] 하단: 최종 확정 장소 영역

## 기본 기능 테스트
- [ ] 지도 표시 확인
- [ ] 지도 클릭 시 좌표 추출 확인
- [ ] Reverse Geocoding으로 주소 조회 확인
- [ ] 후보지 추가 모달 열기 확인
- [ ] 검색 입력 → 검색 결과 표시 확인

---

# 🎯 Phase 4: 후보지 등록 및 투표 시스템 (3일)

## 후보지 쿼리 함수 구현
- [ ] `lib/supabase/queries/locations.ts` 생성
  - [ ] `getLocationsByProject(projectId)` - 프로젝트 후보지 조회 (투표 정보 포함)
  - [ ] `createLocation(projectId, userId, data)` - 후보지 추가
  - [ ] `deleteLocation(locationId)` - 후보지 삭제
  - [ ] `updateLocationApprovalStatus(locationId, isApproved)` - 만장일치 상태 업데이트

## 후보지 API 라우트 구현
- [ ] `app/api/projects/[projectId]/locations/route.ts` 생성
  - [ ] `GET` 구현 (후보지 목록 조회 - 투표 정보 JOIN)
  - [ ] `POST` 구현 (후보지 추가)
    - [ ] 요청 본문: name, address, latitude, longitude, category, memo
    - [ ] 사용자 인증 확인
    - [ ] locations 테이블에 저장 (added_by 사용자 ID 기록)
    - [ ] 반환: 생성된 location 객체

- [ ] `app/api/projects/[projectId]/locations/[locationId]/route.ts` 생성
  - [ ] `DELETE` 구현 (후보지 삭제)
  - [ ] `PUT` 구현 (후보지 수정)

## 투표 쿼리 함수 구현
- [ ] `lib/supabase/queries/votes.ts` 생성
  - [ ] `createOrUpdateVote(locationId, userId, vote)` - 투표 생성/수정
  - [ ] `deleteVote(locationId, userId)` - 투표 삭제
  - [ ] `getVotesByLocation(locationId)` - 특정 장소의 투표 조회

## 투표 API 라우트 구현
- [ ] `app/api/projects/[projectId]/locations/[locationId]/vote/route.ts` 생성
  - [ ] `POST` 구현 (투표 생성 또는 수정)
    - [ ] 요청 본문: vote (true: 찬성, false: 반대)
    - [ ] 사용자 인증 확인
    - [ ] votes 테이블에 UPSERT
    - [ ] 투표 후 해당 location의 is_approved 상태 자동 계산
    - [ ] 성공 시: 업데이트된 location 객체 반환 (투표 정보 포함)

## 지도에서 후보지 등록 통합 흐름
- [ ] NaverMap 컴포넌트에 마커 클릭/검색 결과 선택 통합
  - [ ] **검색 결과 선택 → 지도에 마커 표시 + InfoWindow**
  - [ ] InfoWindow에 LocationInfoWindow 컴포넌트 렌더링
  - [ ] "📷 네이버 지도에서 보기" 버튼 클릭 → 새 탭에서 네이버 지도 링크 열기
    - [ ] 사용자가 실시간 사진, 후기, 메뉴 확인 가능
  - [ ] "➕ 후보지 등록" 버튼 클릭 → AddLocationModal 열기

- [ ] AddLocationModal에서 후보지 추가
  - [ ] 자동 입력: 장소명, 주소, 좌표, 전화번호, 네이버 링크
  - [ ] 사용자 입력: 카테고리, 메모
  - [ ] "추가" 버튼 → `POST /api/projects/[projectId]/locations` 호출
    - [ ] 요청 본문: name, address, latitude, longitude, telephone, naver_link, category, memo
    - [ ] 응답: 생성된 location 객체

## 후보지 목록 및 투표 UI 구현
- [ ] `components/locations/LocationList.tsx` 생성
  - [ ] projectId 받기
  - [ ] API에서 후보지 목록 조회 (투표 정보 포함)
  - [ ] 로딩 상태 처리

- [ ] `components/locations/LocationCard.tsx` 생성
  - [ ] 장소명, 주소, 카테고리, 추가한 사용자명 표시
  - [ ] **투표 상태 표시** (아래 참조):
    - [ ] ✅ 초록 체크: 만장일치 (is_approved = true)
    - [ ] ❌ 검정 X: 만장일치 불가 (is_approved = false)
  - [ ] 투표 버튼 (찬성/반대)
    - [ ] 현재 사용자의 투표 상태 표시
    - [ ] 클릭 시 `POST /api/projects/[projectId]/locations/[locationId]/vote` 호출

## 지도에서 마커 표시 (핀 이모티콘)
- [ ] NaverMap 컴포넌트에서 후보지 목록 받기
  - [ ] projectId와 locations 데이터 받기

- [ ] **각 후보지별 작은 핀 이모티콘 표시**:
  - [ ] **등록한 사용자 색상** (기본):
    - [ ] 🔴 creator가 등록: 빨간 핀
    - [ ] 🔵 member가 등록: 파란 핀
  - [ ] **투표 결과에 따라 색상 변경**:
    - [ ] 🟢 만장일치 (is_approved = true): 초록 핀
    - [ ] ⚫ 만장일치 불가 (is_approved = false): 검은 핀

- [ ] 마커 클릭 이벤트
  - [ ] InfoWindow 표시 (장소명, 주소, 추가한 사용자, 현재 투표 상태)
  - [ ] **"후보지 등록" 버튼** (이미 등록된 장소면 버튼 제거)

## 투표 결과 DB 업데이트 자동화
- [ ] Supabase 트리거 함수 추가 (`03_add_locations_votes_schema.sql`)
  - [ ] `check_location_approval()` 함수 구현
    - [ ] votes 테이블 변경 감지
    - [ ] 프로젝트 멤버 수 확인
    - [ ] 현재 location의 총 찬성 투표 수 계산
    - [ ] 찬성 투표 수 = 멤버 수일 때 → is_approved = true
    - [ ] 아니면 → is_approved = false
  - [ ] 트리거 생성 (`after insert or update on votes`)

## 기능 테스트 (Phase 4)
- [ ] **검색 기능**:
  - [ ] 검색창에 "스타벅스 명동" 입력
  - [ ] 검색 결과 정확도순 표시 확인
  - [ ] 결과 선택 → 지도에 마커 표시 확인

- [ ] **InfoWindow 표시**:
  - [ ] 가게명, 주소, 전화번호 표시
  - [ ] "📷 네이버 지도에서 보기" 버튼 클릭 → 새 탭에서 네이버 지도 열기
    - [ ] 실시간 사진, 후기, 메뉴 확인 가능
  - [ ] "➕ 후보지 등록" 버튼 클릭 → 모달 열기

- [ ] **후보지 등록**:
  - [ ] 모달에서 자동 입력 정보 확인 (가게명, 주소, 좌표, 전화번호)
  - [ ] 카테고리 선택 후 메모 입력
  - [ ] "추가" 버튼 클릭
  - [ ] Supabase의 locations 테이블에 저장 확인

- [ ] **지도 마커 표시**:
  - [ ] 계정 색깔의 핀 표시 (🔴 creator / 🔵 member)
  - [ ] 후보지 목록에 자동 추가

- [ ] **투표 및 상태 변경**:
  - [ ] A 사용자가 찬성 투표 → 마커 색상 유지 (기본 색)
  - [ ] B 사용자도 찬성 투표 → 마커 색상 변경 (초록 핀)
  - [ ] LocationCard에 "✅" 표시 확인
  - [ ] 반대 투표 시나리오 → 검은 핀 + "❌" 표시 확인

---

# 🎯 Phase 5: Realtime 동기화 (후보지 + 투표) (1일)

## Supabase Realtime 설정
- [ ] Supabase Dashboard에서 Realtime 활성화 확인
  - [ ] `locations` 테이블 추가
  - [ ] `votes` 테이블 추가

## Realtime 훅 구현
- [ ] `lib/hooks/useRealtime.ts` 생성
  - [ ] `useRealtimeLocations(projectId)` 훅 구현
    - [ ] 초기 locations 데이터 로드 (투표 정보 포함)
    - [ ] Supabase Realtime 구독 - locations 테이블 (INSERT, UPDATE, DELETE)
    - [ ] Supabase Realtime 구독 - votes 테이블 (INSERT, UPDATE, DELETE)
    - [ ] 상태 업데이트:
      - [ ] locations INSERT → 새 마커 추가
      - [ ] locations UPDATE → 마커 색상 업데이트 (is_approved 변경)
      - [ ] votes INSERT/UPDATE → is_approved 상태 실시간 반영
    - [ ] 언마운트 시 구독 해제

## RealtimeProvider 컨텍스트 구현
- [ ] `components/realtime/RealtimeProvider.tsx` 생성
  - [ ] Context 생성 (locations with votes)
  - [ ] Provider 컴포넌트 구현
  - [ ] useRealtimeLocations 훅으로 데이터 관리
  - [ ] useContext 헬퍼 함수 (useRealtimeContext)

## 프로젝트 페이지에 Realtime 연결
- [ ] `app/projects/[projectId]/page.tsx`에 RealtimeProvider 래핑
  - [ ] 페이지 최상단에 Provider 감싸기
  - [ ] projectId 전달

- [ ] NaverMap, LocationList 컴포넌트에서 useRealtimeContext 사용
  - [ ] Context에서 locations 데이터 가져오기
  - [ ] 후보지 추가, 투표 시 자동 렌더링
  - [ ] 마커 색상 실시간 변경

## 실시간 동기화 테스트
- [ ] 두 브라우저 탭 또는 창에서 같은 프로젝트 접속
- [ ] **탭 A에서 후보지 추가**:
  - [ ] 탭 B에서 즉시 마커 표시 확인 (계정 색상 핀)
  - [ ] LocationCard에 즉시 추가 확인
  - [ ] 새로고침 없이 동기화 확인
- [ ] **탭 A에서 투표 (찬성)**:
  - [ ] 탭 B에서 즉시 LocationCard 상태 업데이트 확인
  - [ ] 아직 만장일치 아니므로 기본 색상 마커 유지
- [ ] **탭 B에서 같은 장소 투표 (찬성)**:
  - [ ] 탭 A, B 모두 마커 색상 즉시 변경 (초록 핀)
  - [ ] LocationCard에 "✅" 표시 확인
  - [ ] is_approved = true로 DB 업데이트 확인

---

# 🎯 Phase 6: 최종 장소 목록 및 타임테이블 준비 (1일)

## 최종 확정 장소 필터링 및 표시
- [ ] LocationList에서 is_approved 상태로 필터링
  - [ ] "전체 후보지" vs "확정된 장소" 구분 (UI 탭 또는 섹션)
  - [ ] 확정된 장소만 별도로 표시

## 프로젝트 페이지 우측 패널 구조 개선
- [ ] 우측/하단 패널에 스크롤 가능한 섹션으로 구분
  - [ ] 상단: 모든 후보지 (LocationList)
  - [ ] 하단: 확정된 장소 섹션 (초록색 배경)

## 확정 장소 지도 강조
- [ ] NaverMap에서 is_approved = true인 마커 강조
  - [ ] 초록색 마커로 표시 (이미 Phase 4에서 적용)
  - [ ] 다른 마커보다 위에 렌더링

## 다음 페이지(타임테이블)을 위한 데이터 준비
- [ ] locations 테이블의 is_approved = true인 장소들
  - [ ] `/api/projects/[projectId]/locations?approved=true` 엔드포인트 추가
  - [ ] 타임테이블 페이지에서 사용할 수 있도록 구조화

## 기능 테스트
- [ ] 여러 후보지 추가 및 투표 완료
- [ ] "확정된 장소" 섹션에 is_approved = true인 장소만 표시 확인
- [ ] 지마에 초록 핀으로 강조 표시 확인
- [ ] is_approved = false인 장소는 별도 섹션에서만 표시 확인

---

# 🎯 Phase 7: UI/UX 개선 및 테스트 (2일)

## 로딩 상태 및 스피너
- [ ] 전역 로딩 상태 관리 (또는 각 컴포넌트별)
- [ ] 데이터 로드 중 스피너 표시
  - [ ] 캘린더 로드 중
  - [ ] 후보지 로드 중
  - [ ] 투표 처리 중
- [ ] shadcn/ui Spinner 또는 커스텀 로더 사용

## 에러 처리 및 메시지
- [ ] 모든 API 호출에 에러 핸들링 추가
  - [ ] 네이버 API 오류 (Reverse Geocoding, Place Search 등)
  - [ ] Supabase 권한 오류 (RLS 위반)
  - [ ] 네트워크 오류
  - [ ] 타임아웃 오류

- [ ] 각 에러별로 명확한 메시지 표시
  - [ ] "지도를 불러올 수 없습니다. 페이지를 새로고침해주세요."
  - [ ] "프로젝트를 불러올 수 없습니다."
  - [ ] "장소 추가에 실패했습니다. 다시 시도해주세요."

## 토스트 알림
- [ ] sonner 라이브러리 설정
- [ ] 성공 알림
  - [ ] "프로젝트가 생성되었습니다."
  - [ ] "공유 링크가 복사되었습니다."
  - [ ] "프로젝트에 참여했습니다."
  - [ ] "장소가 추가되었습니다."
  - [ ] "투표했습니다."

- [ ] 오류 알림
  - [ ] 각 에러별 메시지 표시

## 반응형 디자인 (모바일 우선, 웹도 완벽 대응)

> **원칙**: 모바일에서 주로 사용하지만, 웹/데스크톱에서도 모든 기능이 동등하게 접근 가능해야 함

### 모바일 (375px-480px) - 기본값 (모바일 우선)
- [ ] 캘린더 페이지
  - [ ] 단일 컬럼 레이아웃 (수직 스크롤)
  - [ ] 캘린더 그리드 전체 너비 사용
  - [ ] 배지는 한 줄에 최대 1-2개만 표시
  - [ ] 프로젝트 제목 약자 표시 (첫 6-8자)
  - [ ] 네비게이션: 바텀 탭 (캘린더, 프로젝트 목록, 프로필)

- [ ] 프로젝트 (지도) 페이지
  - [ ] 수직 스택 레이아웃 (지도 위, 목록 아래)
  - [ ] 지도: 300px ~ 350px 높이 고정
  - [ ] 후보지 목록: 나머지 화면 차지, 스크롤 가능
  - [ ] 지도 컨트롤 버튼 우측 하단에 배치 (터치 친화)

- [ ] 랜딩 페이지
  - [ ] 중앙 정렬, 충분한 패딩 (16px)
  - [ ] 버튼은 전체 너비 사용

### 태블릿 (768px-1024px) - 방향에 따라 차등 구성
- [ ] 캘린더 페이지
  - [ ] 캘린더 그리드 확대 (더 큰 셀, 더 읽기 쉬운 텍스트)
  - [ ] 여전히 단일 컬럼 레이아웃 유지

- [ ] 프로젝트 (지도) 페이지
  - [ ] **세로 방향** (태블릿 세로, ~768px):
    - [ ] 모바일과 동일 (상단 지도 350px → 하단 목록 스크롤)
  - [ ] **가로 방향** (태블릿 가로, ~1024px):
    - [ ] 좌측 지도 60% → 우측 목록 40% (데스크톱처럼)
    - [ ] 지도 높이: 화면 전체 (스크롤 안 함)
    - [ ] 후보지 목록: 우측 패널, 스크롤 가능

- [ ] 네비게이션
  - [ ] 바텀 탭 유지 (충분한 공간)

### 웹/데스크톱 (1280px 이상) - 웹 최적화
- [ ] 캘린더 페이지
  - [ ] 여유로운 레이아웃
  - [ ] 캘린더 옆에 사이드바 추가 가능 (오늘의 일정, 빠른 링크 등)

- [ ] 프로젝트 (지도) 페이지
  - [ ] 상단: 헤더 (프로젝트 이름, 날짜, 멤버 정보)
  - [ ] 좌측: 네이버 지도 (60-70% 너비, 화면 전체 높이)
  - [ ] 우측: 후보지 목록 패널 (30-40% 너비, 스크롤 가능)
    - [ ] 장소 검색 입력
    - [ ] 후보지 목록
    - [ ] 최종 확정 장소 섹션

- [ ] 마우스/키보드 최적화
  - [ ] 호버 효과 활성화
    - [ ] 배지 호버 시 풍선 도움말 (프로젝트 전체 이름)
    - [ ] 후보지 호버 시 상세 정보 프리뷰
  - [ ] 키보드 네비게이션 지원
    - [ ] Tab 키로 포커스 이동
    - [ ] Enter/Space로 선택
    - [ ] Esc로 모달 닫기

- [ ] 버튼 & 컨트롤
  - [ ] 컴팩트한 크기 가능 (44px > 32-36px)
  - [ ] 여전히 클릭 가능한 충분한 크기 유지

- [ ] 반응형 구현
  - [ ] Tailwind responsive 클래스 활용
    - [ ] **기본값 (모바일)**: 상단 지도 350px → 하단 목록 (스크롤)
    - [ ] `md:` (768px): 태블릿 세로 - 모바일과 동일 레이아웃 유지
    - [ ] `lg:` (1024px): 태블릿 가로 ~ 데스크톱 - 좌우 분할 시작 (지도 60%, 목록 40%)
    - [ ] `xl:` (1280px): 데스크톱 최적화 (여유로운 간격, 호버 효과)

## 접근성 개선
- [ ] 버튼 포커스 상태 명확하게
- [ ] 폼 라벨 추가
- [ ] 키보드 네비게이션 지원
- [ ] 색상만으로 정보 전달하지 않기 (아이콘 추가)

## 성능 최적화
- [ ] 이미지 최적화 (아이콘, 로고 등)
- [ ] 번들 크기 확인 및 최적화
- [ ] 렌더링 성능 확인 (불필요한 리렌더링 제거)
- [ ] 네이버 지도 API 성능 (마커 많을 때 처리)

## 전체 End-to-End 테스트
- [ ] **시나리오 0: 랜딩 및 로그인**
  - [ ] 랜딩 페이지 접속 → 제목 및 버튼 표시
  - [ ] 로그인 → 캘린더 페이지로 이동

- [ ] **시나리오 1: 프로젝트 생성 및 공유**
  - [ ] 캘린더에서 날짜 클릭 → 모달 열기
  - [ ] 제목 입력 → 생성
  - [ ] 배지 표시 확인
  - [ ] 공유 링크 복사 → B 계정에서 참여

- [ ] **시나리오 2: 장소 추가 (실시간)**
  - [ ] A가 지도 클릭 → 주소 자동 입력
  - [ ] 카테고리 선택 → 추가
  - [ ] B 화면에 즉시 마커 표시
  - [ ] 우측 목록에 장소 표시

- [ ] **시나리오 3: 투표 (실시간)**
  - [ ] A가 찬성 투표 → 1/2 표시
  - [ ] B가 찬성 투표 → 2/2 확정
  - [ ] 마커 색상 변경 (초록색)
  - [ ] 확정된 장소 섹션에 표시

- [ ] **시나리오 4: 에러 처리**
  - [ ] 미로그인 상태에서 프로젝트 접근 → 리다이렉트
  - [ ] 네트워크 오류 시뮬레이션 → 에러 메시지 표시

## 최종 코드 리뷰
- [ ] 코드 스타일 및 컨벤션 확인
- [ ] 타입 안정성 확인 (TypeScript)
- [ ] 주석 및 문서화 확인
- [ ] 불필요한 코드 정리

## 배포 전 체크리스트
- [ ] 모든 환경 변수 설정 확인
- [ ] RLS 정책 테스트 완료
- [ ] Realtime 동기화 테스트 (두 브라우저)
- [ ] 모바일 반응형 테스트
- [ ] 성능 테스트 (Lighthouse 등)
- [ ] 보안 검토 (API 키 노출 확인 등)

---

## 📊 체크리스트 사용법

### 작업 진행 상황 업데이트
각 Task를 완료하면 다음과 같이 체크 표시를 합니다:
```markdown
- [x] 완료된 작업
- [ ] 진행 중인 작업
- [ ] 미완료 작업
```

### 진행 상황 추적
```
Phase 0: ████░░░░░░ 40% (4/10 완료)
Phase 1: ███░░░░░░░ 30% (3/10 완료)
Phase 2: ██░░░░░░░░ 20% (2/10 완료)
...
```

### 주요 마일스톤
- [x] Phase 0 완료 → 랜딩 + 캘린더 작동
- [x] Phase 1 완료 → 프로젝트 생성 가능
- [x] Phase 2 완료 → 공유 및 참여 가능
- [ ] Phase 3 완료 → 네이버 지도 기본 UI 구현
- [ ] Phase 4 완료 → 후보지 등록 + 투표 시스템 (색상 핀 + is_approved)
- [ ] Phase 5 완료 → 실시간 동기화 (지도 + 목록 + 투표)
- [ ] Phase 6 완료 → 최종 장소 목록 (타임테이블 준비)
- [ ] Phase 7 완료 → MVP 출시 준비 완료

---

---

## 📈 진행 상황

### 완료된 페이즈
- [x] **Phase 0** (100%) - 랜딩 페이지 + 캘린더 구현 완료
- [x] **Phase 1** (100%) - 데이터베이스 + 프로젝트 생성 완료

### 진행 중인 페이즈
- [x] **Phase 2** (100%) - 공유 링크 생성 + 참여 완료

### 다음 페이즈
- [ ] Phase 3: 네이버 지도 기본 구현
- [ ] Phase 4: 후보지 등록 및 투표 시스템
- [ ] Phase 5: Realtime 동기화 (후보지 + 투표)
- [ ] Phase 6: 최종 장소 목록 및 타임테이블 준비
- [ ] Phase 7: UI/UX 개선 및 전체 테스트

---

**마지막 업데이트**: 2026년 2월 28일
**상태**: Phase 1, 2 완료 → Phase 3 준비 중
**다음 단계**: Phase 3 네이버 지도 기본 구현

---

## 📋 검색 기반 후보지 등록 및 투표 시스템 (Phase 3-6)

### 전체 흐름 요약
1. **특정 가게 검색** (핵심 기능):
   - 검색창에 "스타벅스 명동" 또는 "강남 한식" 입력
   - 네이버 Place Search API → 정확도순 결과 (가게명, 주소, 좌표, 전화, 링크)
   - 원하는 가게 선택

2. **InfoWindow 표시 및 네이버 지도 확인**:
   - 지도에 마커 표시
   - InfoWindow: 가게명, 주소, 전화번호
   - **"📷 네이버 지도에서 보기" 버튼** → 새 탭에서 실시간 사진/후기/메뉴 확인
   - **"➕ 후보지 등록" 버튼** → 모달 열기

3. **후보지 등록**:
   - 사용자 계정에 맞는 색상 핀 표시 (🔴 creator / 🔵 member)
   - locations 테이블에 저장
   - 후보지 목록에 자동 추가
3. **투표 (두 명 모두 가능)**:
   - LocationCard에서 찬성/반대 투표
   - votes 테이블에 저장
   - Supabase 트리거로 is_approved 자동 계산
4. **만장일치 (찬성 투표 수 = 멤버 수)**:
   - is_approved = true
   - 마커 색상 변경: 🟢 초록 핀
   - LocationCard: ✅ 초록 체크 표시
5. **만장일치 불가 (일부 반대 또는 투표 안 함)**:
   - is_approved = false
   - 마커 색상 변경: ⚫ 검은 핀
   - LocationCard: ❌ 검정 X 표시
6. **다음 페이지 (타임테이블)**:
   - is_approved = true인 장소들 표시
   - 최종 선정된 장소들로 일정 기획

### DB 스키마 추가
- **locations 테이블**:
  - `is_approved` (BOOLEAN) - 만장일치 여부
  - `added_by` (UUID) - 후보지 추가한 사용자
- **votes 테이블**:
  - `vote` (BOOLEAN) - true: 찬성, false: 반대
  - UNIQUE(location_id, user_id)

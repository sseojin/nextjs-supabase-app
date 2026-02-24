# Next.js + Supabase 프로젝트 규칙

이 파일은 `nextjs-supabase-app` 프로젝트의 코딩 규칙과 아키텍처 가이드입니다.

---

## 📂 프로젝트 구조

```
app/                    # Next.js App Router
├── (auth)/            # 인증 관련 라우트
├── (dashboard)/       # 대시보드 라우트
├── api/               # API 라우트
└── layout.tsx         # 루트 레이아웃

components/           # 재사용 가능한 UI 컴포넌트
├── auth/             # 인증 관련 컴포넌트
├── dashboard/        # 대시보드 컴포넌트
├── ui/               # shadcn/ui 컴포넌트
└── ...

lib/                  # 유틸리티 및 헬퍼 함수
├── supabase/        # Supabase 클라이언트 설정
├── types/           # TypeScript 타입 정의
└── utils/           # 공통 유틸리티
```

---

## 🔌 API 라우트 규칙

### 파일 위치

- `app/api/[endpoint]/route.ts`
- 각 엔드포인트별로 폴더 생성

### 구조

```typescript
// app/api/users/route.ts

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // API 로직
    const { data, error } = await supabase.from("users").select("*");

    if (error) throw error;

    return Response.json(data);
  } catch (error) {
    console.error("API 오류:", error);
    return Response.json({ error: "요청 실패" }, { status: 500 });
  }
}
```

### 규칙

- 각 HTTP 메서드별로 함수 정의 (GET, POST, PUT, DELETE)
- 항상 try-catch 사용
- 에러는 콘솔과 응답으로 모두 반환
- 상태 코드 명시 (200, 400, 404, 500 등)

---

## 🗂️ 컴포넌트 규칙

### 파일명

- 파일명은 **PascalCase** (UserCard.tsx)
- 폴더명은 **camelCase** (authForm/)

### Server Component vs Client Component

```typescript
// Server Component (기본값) - 데이터 페칭, DB 접근
export default async function UserList() {
  const data = await fetchUsers();
  return <div>{/* ... */}</div>;
}

// Client Component - 인터랙션, 상태 관리
"use client";
import { useState } from "react";
export default function UserForm() {
  const [formData, setFormData] = useState({});
  return <form>{/* ... */}</form>;
}
```

### Props 타입 정의

```typescript
interface UserCardProps {
  userId: string;
  userName: string;
  isActive: boolean;
  onDelete?: () => void;
}

export default function UserCard({
  userId,
  userName,
  isActive,
  onDelete,
}: UserCardProps) {
  return <div>{/* ... */}</div>;
}
```

### 규칙

- 항상 Props 인터페이스 정의
- 선택적 Props는 `?` 사용
- 컴포넌트는 300줄 이하 유지
- 복잡한 로직은 커스텀 훅으로 분리

---

## 🗄️ Supabase 규칙

### 클라이언트 생성

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

// lib/supabase/server.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const createServerClient = () => createServerComponentClient({ cookies });
```

### 데이터 페칭 패턴

```typescript
// lib/supabase/queries.ts

export async function fetchUsers() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`사용자 조회 실패: ${error.message}`);

  return data;
}
```

### 규칙

- 모든 쿼리는 `lib/supabase/queries.ts`에서 관리
- 컴포넌트에서 직접 `supabase` 호출 금지
- 에러는 명확한 메시지와 함께 throw
- 타입 안정성: `Database` 타입 활용

---

## 🎨 Tailwind CSS 규칙

### 클래스 정렬 순서

```tsx
// ✅ 좋음
<div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
  {/* 1순위: 레이아웃 (flex, grid, display)
      2순위: 간격 (p, m, gap)
      3순위: 크기 (w, h, size)
      4순위: 색상 (bg, text, border)
      5순위: 기타 (shadow, rounded) */}
</div>

// ❌ 피하기
<div className="shadow-md rounded-lg p-4 bg-white gap-4 flex-col flex">
```

### 커스텀 클래스

```typescript
// 많은 클래스의 반복을 피하기 위해 컴포넌트화
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {children}
    </div>
  );
}
```

---

## 🔐 인증 (Supabase Auth)

### 기본 흐름

```typescript
// app/api/auth/signin/route.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const supabase = createRouteHandlerClient({ cookies });

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ success: true });
}
```

### 규칙

- 인증 상태는 context나 hook으로 관리
- 토큰은 쿠키에 자동 저장 (보안)
- 보호된 라우트는 미들웨어로 관리

---

## 📝 타입 정의

### 위치

- `lib/types/` - 프로젝트 전체 타입
- `components/[feature]/types.ts` - 기능별 타입

### 네이밍

```typescript
// ✅ 좋음
type User = {
  id: string;
  email: string;
  name: string;
};

interface UserRepository {
  find(id: string): Promise<User | null>;
  create(user: User): Promise<User>;
}

// ❌ 피하기
type IUser = {
  /* ... */
}; // Interface 접두사 불필요
type user = {
  /* ... */
}; // PascalCase 사용
```

---

## 🧪 테스트

### 파일 위치

- `__tests__/` 또는 `.test.ts` / `.spec.ts` 파일명

### 기본 패턴

```typescript
// lib/__tests__/utils.test.ts

import { describe, it, expect } from "vitest";
import { formatDate } from "@/lib/utils";

describe("formatDate", () => {
  it("날짜를 YYYY-MM-DD 형식으로 반환해야 함", () => {
    const result = formatDate(new Date("2024-02-19"));
    expect(result).toBe("2024-02-19");
  });

  it("유효하지 않은 날짜는 에러를 발생시켜야 함", () => {
    expect(() => formatDate(new Date("invalid"))).toThrow();
  });
});
```

---

## 🚀 배포 고려사항

### 환경 변수

- `.env.local` - 로컬 개발용 (커밋 금지)
- `.env.example` - 예시 파일 (커밋 필수)
- 민감 정보는 `NEXT_PUBLIC_` 제외

### 빌드 체크

```bash
# 빌드 전 확인
npm run build
npm run lint
```

---

## 🔄 개발 워크플로우

1. **브랜치 생성**: `feature/기능명` 또는 `fix/버그명`
2. **코드 작성**: 이 규칙 따르기
3. **테스트**: 핵심 로직 테스트 작성
4. **커밋**: 한국어로 명확하게 작성
5. **PR**: 변경 사항 설명과 함께 제출

### 커밋 메시지 예시

```
feat: 사용자 프로필 수정 기능 추가

- 프로필 에디팅 페이지 구현
- Supabase 업데이트 쿼리 추가
- 입력값 유효성 검사 추가

Closes #123
```

---

## 📚 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

---

**마지막 업데이트**: 2026-02-19

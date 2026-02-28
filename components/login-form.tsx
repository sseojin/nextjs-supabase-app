"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/supabase/authErrorHandler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  // URL의 returnUrl 파라미터를 클라이언트에서만 읽기
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const url = params.get("returnUrl");
      setReturnUrl(url);
    }
  }, []);

  // 로그인 후 이동할 페이지 결정
  const getRedirectUrl = () => {
    return returnUrl || "/dashboard";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // 로그인 성공 시 returnUrl로 이동하거나 대시보드로 이동
      router.push(getRedirectUrl());
    } catch (error: unknown) {
      const errorMessage = translateAuthError(error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Google OAuth 로그인 시작
   *
   * 작동 방식:
   * 1. signInWithOAuth()로 Supabase가 Google OAuth URL 생성
   * 2. 브라우저를 Google 로그인 페이지로 리다이렉트
   * 3. 사용자가 Google에서 로그인 및 권한 승인
   * 4. Google이 /auth/callback?code=xxx로 리다이렉트
   * 5. callback 라우트에서 세션 생성 및 returnUrl로 이동
   */
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    setIsGoogleLoading(true);
    setError(null);

    try {
      // returnUrl이 있으면 callback에 전달
      const redirectUrl = getRedirectUrl();
      const nextParam = redirectUrl === "/dashboard" ? "/dashboard" : redirectUrl;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // 콜백 URL: OAuth 완료 후 returnUrl로 이동
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`,
        },
      });

      if (error) {
        console.error("[Google Login] 시작 실패:", error);
        const errorMessage = translateAuthError(error);
        setError(errorMessage);
        setIsGoogleLoading(false);
      }
      // 성공 시 브라우저가 Google로 리다이렉트됨
      // 이 지점에 도달하지 않음
    } catch (error: unknown) {
      console.error("[Google Login] 예외:", error);
      const errorMessage = translateAuthError(error);
      setError(errorMessage);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>계정에 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">비밀번호</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>

              {/* 구분선 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">또는</span>
                </div>
              </div>

              {/* Google 로그인 버튼 */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  "Google로 연결 중..."
                ) : (
                  <>
                    {/* Google 로고 SVG */}
                    <svg
                      className="mr-2 h-4 w-4"
                      aria-hidden="true"
                      focusable="false"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 488 512"
                    >
                      <path
                        fill="currentColor"
                        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                      />
                    </svg>
                    Google로 로그인
                  </>
                )}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              계정이 없으신가요?{" "}
              <Link href="/auth/sign-up" className="underline underline-offset-4">
                회원가입
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

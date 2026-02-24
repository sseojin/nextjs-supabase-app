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
import { useState } from "react";

// URL 에러 코드를 한국어로 변환
function translateUrlError(errorCode?: string): string | null {
  if (!errorCode) return null;

  const errorMap: Record<string, string> = {
    access_denied: "접근이 거부되었습니다.",
    otp_expired: "비밀번호 재설정 링크가 만료되었습니다. 다시 비밀번호를 재설정해주세요.",
    invalid_grant: "유효하지 않은 요청입니다.",
    session_not_found: "세션을 찾을 수 없습니다. 다시 로그인해주세요.",
  };

  return errorMap[errorCode] || errorCode;
}

interface UpdatePasswordFormProps extends React.ComponentPropsWithoutRef<"div"> {
  initialError?: string;
}

export function UpdatePasswordForm({ className, initialError, ...props }: UpdatePasswordFormProps) {
  const [password, setPassword] = useState("");
  // initialError를 한국어로 변환
  const [error, setError] = useState<string | null>(
    initialError ? translateUrlError(initialError) : null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/protected");
    } catch (error: unknown) {
      const errorMessage = translateAuthError(error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">비밀번호 재설정</CardTitle>
          <CardDescription>새 비밀번호를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-red-500">{error}</p>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">다시 비밀번호를 재설정하려면:</p>
                <Link
                  href="/auth/forgot-password"
                  className="inline-block rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  비밀번호 재설정 링크 다시 요청
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="password">새 비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="새 비밀번호"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "저장 중..." : "새 비밀번호 저장"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

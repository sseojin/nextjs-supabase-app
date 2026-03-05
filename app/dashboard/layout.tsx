import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

/**
 * 대시보드 레이아웃 (보호된 라우트)
 * 서버 컴포넌트에서 인증 확인을 수행
 * 미로그인 사용자는 /auth/login으로 리다이렉트
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 서버에서 인증 확인
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (error || !data.user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 헤더 */}
      <header className="w-full border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">📅 Date Planner</h1>
          <div className="flex items-center gap-3">
            <div className="text-sm font-bold text-slate-600 scale-110">
              {data.user.user_metadata?.name || data.user.email}님
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}

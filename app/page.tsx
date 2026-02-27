import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* 로고 및 제목 */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="text-4xl font-bold text-slate-900">📅</div>
          <h1 className="text-3xl font-bold text-slate-900">Date Planner</h1>
          <p className="text-sm text-slate-600 text-center">프로젝트와 일정을 한눈에 관리하세요</p>
        </div>

        {/* 메인 카드 */}
        <Card className="flex flex-col gap-6 p-6 shadow-lg bg-white">
          {/* 설명 텍스트 */}
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-slate-900">함께하는 프로젝트 관리</h2>
            <p className="text-sm text-slate-600">
              팀 프로젝트를 캘린더에서 체계적으로 관리하고, 진행 상황을 실시간으로 공유하세요.
            </p>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex flex-col gap-3">
            <Link href="/auth/sign-up" className="w-full">
              <Button className="w-full h-12 text-base font-medium" size="lg">
                회원가입
              </Button>
            </Link>

            <Link href="/auth/login" className="w-full">
              <Button variant="outline" className="w-full h-12 text-base font-medium" size="lg">
                로그인
              </Button>
            </Link>
          </div>
        </Card>

        {/* 푸터 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">계정이 필요합니다. 시작해보세요.</p>
        </div>
      </div>
    </main>
  );
}

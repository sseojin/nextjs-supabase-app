"use client";

import { UpdatePasswordForm } from "@/components/update-password-form";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function UpdatePasswordContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || searchParams.get("error_description");

  return <UpdatePasswordForm initialError={error || undefined} />;
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="flex items-center justify-center p-8">로딩 중...</div>}>
          <UpdatePasswordContent />
        </Suspense>
      </div>
    </div>
  );
}

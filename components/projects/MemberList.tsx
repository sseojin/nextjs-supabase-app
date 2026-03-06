"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { ProjectMember } from "@/lib/types/project";

interface MemberListProps {
  members: ProjectMember[];
  className?: string;
}

/**
 * 프로젝트의 멤버 목록을 표시하는 컴포넌트
 * 각 멤버의 역할(creator/member)과 색상(보라/노랑)을 시각적으로 표시합니다.
 * Creator는 최상단에 배치되고, 참여 시간을 표시합니다.
 */
export default function MemberList({ members, className = "" }: MemberListProps) {
  if (!members || members.length === 0) {
    return (
      <div className={`w-full border border-gray-200 rounded-lg p-4 ${className}`}>
        <h3 className="font-semibold text-gray-900 mb-3">멤버</h3>
        <p className="text-sm text-gray-500 text-center py-4">멤버가 없습니다.</p>
      </div>
    );
  }

  // Creator를 먼저, 나머지는 참여 시간 순으로 정렬
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === "creator") return -1;
    if (b.role === "creator") return 1;
    return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
  });

  return (
    <div className={`w-full border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">멤버 ({members.length})</h3>
      </div>

      {/* 멤버 목록 */}
      <div className="space-y-2">
        {sortedMembers.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}

/**
 * 개별 멤버 카드 컴포넌트
 */
function MemberCard({ member }: { member: ProjectMember }) {
  const isCreator = member.role === "creator";
  // role에 따라 색상 결정 (display_color 무시)
  const displayColor = isCreator ? "#9333EA" : "#EAB308"; // 보라: purple-600, 노랑: yellow-500
  const roleLabel = isCreator ? "생성자" : "참여자";

  // 참여 시간 포맷팅
  const joinedDate = new Date(member.joined_at);
  const formattedDate = format(joinedDate, "yyyy.MM.dd HH:mm", {
    locale: ko,
  });

  // 사용자 이름 표시 (우선순위: user_name > user_email > user_id)
  const getDisplayName = (): string => {
    // 1순위: user_name (구글 로그인 시 full_name)
    if (member.user_name) {
      return member.user_name;
    }

    // 2순위: user_email (이메일에서 @ 앞부분 추출)
    if (member.user_email) {
      const emailPrefix = member.user_email.split("@")[0];
      return emailPrefix;
    }

    // 3순위: user_id (축약)
    return `${member.user_id.substring(0, 8)}...`;
  };

  const displayName = getDisplayName();

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-100">
      {/* 색상 배지 */}
      <div
        className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
        style={{ backgroundColor: displayColor }}
        title={roleLabel}
      />

      {/* 멤버 정보 */}
      <div className="flex-1 min-w-0">
        {/* 역할 배지 + 사용자 이름 */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${
              isCreator ? "bg-purple-100 text-purple-700" : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {roleLabel}
          </span>
          <span className="text-sm font-medium text-gray-900 truncate">{displayName}</span>
        </div>

        {/* 참여 시간 */}
        <p className="text-xs text-gray-500">{formattedDate}</p>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Candidate, CandidateWithUserVote, FinalLocation } from "@/lib/types/candidate";

/**
 * 프로젝트의 모든 후보지를 투표 정보와 함께 조회합니다.
 * 각 후보지에 대해 찬성/반대 투표 수를 포함합니다.
 *
 * @param projectId - 프로젝트 ID
 * @param userId - 사용자 ID (사용자의 투표 정보를 조회하기 위해 선택사항)
 * @returns {Promise<CandidateWithUserVote[]>} 후보지 배열 (사용자 투표 정보 포함)
 * @throws 에러 발생 시 명확한 메시지와 함께 throw
 */
export async function getCandidates(
  projectId: string,
  userId?: string,
): Promise<CandidateWithUserVote[]> {
  try {
    const supabase = await createClient();

    // 현재 사용자 조회
    let currentUserId = userId;
    if (!currentUserId) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("인증이 필요합니다.");
      }

      currentUserId = user.id;
    }

    // 프로젝트의 총 멤버 수 조회
    const { data: members, error: membersError } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId);

    if (membersError) {
      throw new Error(`멤버 정보 조회 실패: ${membersError.message}`);
    }

    const totalMembers = members?.length || 0;

    // 프로젝트의 모든 후보지 조회
    const { data: candidates, error: candidatesError } = await supabase
      .from("candidates")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (candidatesError) {
      throw new Error(`후보지 조회 실패: ${candidatesError.message}`);
    }

    if (!candidates || candidates.length === 0) {
      return [];
    }

    // 모든 투표 정보 조회 (모든 사용자의 투표)
    const { data: allVotes, error: allVotesError } = await supabase
      .from("candidate_votes")
      .select("candidate_id, vote_type, user_id")
      .in(
        "candidate_id",
        candidates.map((c) => c.id),
      );

    if (allVotesError) {
      throw new Error(`투표 정보 조회 실패: ${allVotesError.message}`);
    }

    // 후보지별 투표 수를 직접 계산 (candidates 테이블의 값 무시)
    // 이렇게 하면 트리거 미작동 시에도 정확한 투표 수를 보장
    const voteCountMap = new Map<string, { agree: number; disagree: number }>();
    const userVoteMap = new Map<string, string>();

    (allVotes || []).forEach((vote) => {
      // 후보지별 투표 수 집계
      if (!voteCountMap.has(vote.candidate_id)) {
        voteCountMap.set(vote.candidate_id, { agree: 0, disagree: 0 });
      }

      const counts = voteCountMap.get(vote.candidate_id)!;
      if (vote.vote_type === "agree") {
        counts.agree++;
      } else {
        counts.disagree++;
      }

      // 현재 사용자의 투표 저장
      if (vote.user_id === currentUserId) {
        userVoteMap.set(vote.candidate_id, vote.vote_type);
      }
    });

    // 후보지에 사용자 투표 정보 추가 및 찬성 비율 계산
    // 찬성 비율 = (찬성 수 / 전체 멤버 수) × 100
    const candidatesWithVotes: CandidateWithUserVote[] = candidates.map((candidate) => {
      const counts = voteCountMap.get(candidate.id) || { agree: 0, disagree: 0 };
      const agreement_ratio = totalMembers === 0 ? 0 : (counts.agree / totalMembers) * 100;

      return {
        ...candidate,
        votes_agree: counts.agree, // ← candidates 테이블 값 무시, 직접 계산
        votes_disagree: counts.disagree, // ← candidates 테이블 값 무시, 직접 계산
        user_vote: userVoteMap.get(candidate.id) || null,
        agreement_ratio: Math.round(agreement_ratio * 10) / 10, // 소수점 1자리
      };
    });

    return candidatesWithVotes;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("후보지 조회 중 알 수 없는 오류가 발생했습니다.");
  }
}

/**
 * 새로운 후보지를 프로젝트에 추가합니다.
 *
 * @param projectId - 프로젝트 ID
 * @param candidate - 후보지 정보 (location_name, address, category, lat, lng)
 * @param userId - 사용자 ID (후보지 등록자)
 * @returns {Promise<Candidate>} 생성된 후보지 정보
 * @throws 에러 발생 시 명확한 메시지와 함께 throw
 */
export async function createCandidate(
  projectId: string,
  candidate: {
    location_name: string;
    address: string;
    category?: string;
    lat: number;
    lng: number;
    memo?: string;
  },
  userId: string,
): Promise<Candidate> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("candidates")
      .insert([
        {
          project_id: projectId,
          location_name: candidate.location_name,
          address: candidate.address,
          category: candidate.category,
          lat: candidate.lat,
          lng: candidate.lng,
          memo: candidate.memo,
          created_by: userId,
        },
      ])
      .select("*")
      .single();

    if (error) {
      throw new Error(`후보지 등록 실패: ${error.message}`);
    }

    if (!data) {
      throw new Error("후보지 등록 후 데이터를 조회할 수 없습니다.");
    }

    return data as Candidate;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("후보지 등록 중 알 수 없는 오류가 발생했습니다.");
  }
}

/**
 * 후보지를 삭제합니다.
 * 후보지 삭제 시 관련된 모든 투표 기록도 함께 삭제됩니다. (ON DELETE CASCADE)
 *
 * @param candidateId - 후보지 ID
 * @returns {Promise<void>}
 * @throws 에러 발생 시 명확한 메시지와 함께 throw
 */
export async function deleteCandidate(candidateId: string): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("candidates").delete().eq("id", candidateId);

    if (error) {
      throw new Error(`후보지 삭제 실패: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("후보지 삭제 중 알 수 없는 오류가 발생했습니다.");
  }
}

/**
 * 후보지의 메모를 수정합니다.
 *
 * @param candidateId - 후보지 ID
 * @param memo - 새로운 메모 내용 (null이면 메모 삭제)
 * @returns {Promise<string | null>} 수정된 메모 내용
 * @throws 에러 발생 시 명확한 메시지와 함께 throw
 */
export async function updateCandidateMemo(
  candidateId: string,
  memo: string | null,
): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("candidates")
      .update({ memo })
      .eq("id", candidateId)
      .select("memo")
      .single();

    if (error) {
      throw new Error(`메모 수정 실패: ${error.message}`);
    }

    return data?.memo || null;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("메모 수정 중 알 수 없는 오류가 발생했습니다.");
  }
}

/**
 * 투표를 생성, 변경, 또는 취소합니다.
 * - 투표 없음 → 투표: INSERT
 * - 기존 투표 변경 (찬성 → 반대): UPDATE vote_type
 * - 투표 취소 (같은 버튼 재클릭): DELETE
 *
 * @param candidateId - 후보지 ID
 * @param userId - 투표자 사용자 ID
 * @param voteType - 투표 유형 ('agree' | 'disagree' | null for delete)
 * @returns {Promise<{votes_agree: number, votes_disagree: number, user_vote: string | null, agreement_ratio: number}>} 업데이트된 투표 정보
 * @throws 에러 발생 시 명확한 메시지와 함께 throw
 */
export async function voteCandidate(
  candidateId: string,
  userId: string,
  voteType: "agree" | "disagree" | null,
): Promise<{
  votes_agree: number;
  votes_disagree: number;
  user_vote: "agree" | "disagree" | null;
  agreement_ratio: number;
}> {
  try {
    // Admin 클라이언트 사용 (RLS 우회)
    // API route에서 이미 userId를 검증했으므로, RLS를 우회하여 모든 투표에 접근
    const supabase = createAdminClient();

    // 기존 투표 조회
    const { data: existingVote, error: selectError } = await supabase
      .from("candidate_votes")
      .select("*")
      .eq("candidate_id", candidateId)
      .eq("user_id", userId)
      .maybeSingle();

    if (selectError) {
      throw new Error(`투표 정보 조회 실패: ${selectError.message}`);
    }

    // 투표 취소 (voteType이 null인 경우만 취소)
    // 클라이언트가 명시적으로 null을 보낸 경우에만 취소 처리
    if (voteType === null) {
      if (existingVote) {
        const { error: deleteError } = await supabase
          .from("candidate_votes")
          .delete()
          .eq("id", existingVote.id);

        if (deleteError) {
          throw new Error(`투표 취소 실패: ${deleteError.message}`);
        }
      }
      // existingVote가 없으면 아무것도 안 함 (이미 투표 안 한 상태)
    } else if (existingVote) {
      // 투표 변경 또는 덮어쓰기 (기존 투표가 있으면 업데이트)
      // 같은 타입으로 다시 투표해도 덮어쓰기 (취소 안 함)
      const { error: updateError } = await supabase
        .from("candidate_votes")
        .update({ vote_type: voteType })
        .eq("id", existingVote.id);

      if (updateError) {
        throw new Error(`투표 변경 실패: ${updateError.message}`);
      }
    } else {
      // 새 투표 생성
      const { error: insertError } = await supabase.from("candidate_votes").insert([
        {
          candidate_id: candidateId,
          user_id: userId,
          vote_type: voteType,
        },
      ]);

      if (insertError) {
        throw new Error(`투표 생성 실패: ${insertError.message}`);
      }
    }

    // 투표 후 현재 투표 수를 직접 계산
    // 트리거는 비동기적으로 실행되므로, 트리거에 의존하지 않고 직접 계산합니다
    const { data: allVotes, error: votesError } = await supabase
      .from("candidate_votes")
      .select("vote_type")
      .eq("candidate_id", candidateId);

    if (votesError) {
      throw new Error(`투표 집계 실패: ${votesError.message}`);
    }

    const votes_agree = (allVotes || []).filter((v) => v.vote_type === "agree").length;
    const votes_disagree = (allVotes || []).filter((v) => v.vote_type === "disagree").length;

    // 4. 프로젝트의 총 멤버 수 조회 (투표율 계산에 필요)
    const { data: candidate } = await supabase
      .from("candidates")
      .select("project_id")
      .eq("id", candidateId)
      .single();

    let totalMembers = 0;
    if (candidate) {
      const { data: members } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", candidate.project_id);
      totalMembers = members?.length || 0;
    }

    // 5. 사용자의 현재 투표 상태 조회
    const { data: updatedUserVote } = await supabase
      .from("candidate_votes")
      .select("vote_type")
      .eq("candidate_id", candidateId)
      .eq("user_id", userId)
      .maybeSingle();

    // 찬성 비율 = (찬성 수 / 전체 멤버 수) × 100
    const agreement_ratio = totalMembers === 0 ? 0 : (votes_agree / totalMembers) * 100;

    return {
      votes_agree,
      votes_disagree,
      user_vote: updatedUserVote?.vote_type || null,
      agreement_ratio: Math.round(agreement_ratio * 10) / 10,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("투표 처리 중 알 수 없는 오류가 발생했습니다.");
  }
}

/**
 * 최종 선정된 장소 목록을 조회합니다.
 *
 * @param projectId - 프로젝트 ID
 * @returns {Promise<FinalLocation[]>} 최종 선정된 장소 배열
 * @throws 에러 발생 시 명확한 메시지와 함께 throw
 */
export async function getFinalLocations(projectId: string): Promise<FinalLocation[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("final_locations")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`최종 장소 조회 실패: ${error.message}`);
    }

    return (data || []) as FinalLocation[];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("최종 장소 조회 중 알 수 없는 오류가 발생했습니다.");
  }
}

/**
 * 최종 선정 장소를 저장합니다.
 * 찬성 >= 66%인 후보지만 저장 가능합니다.
 *
 * @param projectId - 프로젝트 ID
 * @param candidateId - 후보지 ID
 * @returns {Promise<FinalLocation>} 저장된 최종 장소 정보
 * @throws 에러 발생 시 명확한 메시지와 함께 throw
 */
export async function createFinalLocation(
  projectId: string,
  candidateId: string,
): Promise<FinalLocation> {
  try {
    const supabase = await createClient();

    // 후보지 정보 조회
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", candidateId)
      .eq("project_id", projectId)
      .single();

    if (candidateError) {
      throw new Error(`후보지 조회 실패: ${candidateError.message}`);
    }

    if (!candidate) {
      throw new Error("후보지를 찾을 수 없습니다.");
    }

    // 프로젝트의 총 멤버 수 조회
    const { data: members, error: membersError } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId);

    if (membersError) {
      throw new Error(`멤버 정보 조회 실패: ${membersError.message}`);
    }

    const totalMembers = members?.length || 0;

    // 찬성 비율 = (찬성 수 / 전체 멤버 수) × 100
    const agreement_ratio = totalMembers === 0 ? 0 : (candidate.votes_agree / totalMembers) * 100;

    // 66% 이상 확인
    if (agreement_ratio < 66) {
      throw new Error("찬성이 66% 미만입니다. 최종 장소로 저장할 수 없습니다.");
    }

    // 이미 저장된 최종 장소 확인
    const { data: existingFinalLocation } = await supabase
      .from("final_locations")
      .select("id")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (existingFinalLocation) {
      throw new Error("이미 최종 장소로 저장된 후보지입니다.");
    }

    // 최종 장소 저장
    const { data: finalLocation, error: insertError } = await supabase
      .from("final_locations")
      .insert([
        {
          project_id: projectId,
          candidate_id: candidateId,
          location_name: candidate.location_name,
          address: candidate.address,
          category: candidate.category,
          lat: candidate.lat,
          lng: candidate.lng,
          votes_agree: candidate.votes_agree,
          votes_disagree: candidate.votes_disagree,
          agreement_ratio: Math.round(agreement_ratio * 10) / 10,
        },
      ])
      .select("*")
      .single();

    if (insertError) {
      throw new Error(`최종 장소 저장 실패: ${insertError.message}`);
    }

    if (!finalLocation) {
      throw new Error("최종 장소 저장 후 데이터를 조회할 수 없습니다.");
    }

    return finalLocation as FinalLocation;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("최종 장소 저장 중 알 수 없는 오류가 발생했습니다.");
  }
}

/**
 * 최종 선정 장소를 삭제합니다.
 * 찬성이 66% 미만으로 내려갔을 때 자동으로 호출됩니다.
 *
 * @param candidateId - 후보지 ID
 * @returns {Promise<void>}
 * @throws 에러 발생 시 명확한 메시지와 함께 throw
 */
export async function deleteFinalLocation(candidateId: string): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("final_locations")
      .delete()
      .eq("candidate_id", candidateId);

    if (error) {
      throw new Error(`최종 장소 삭제 실패: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("최종 장소 삭제 중 알 수 없는 오류가 발생했습니다.");
  }
}

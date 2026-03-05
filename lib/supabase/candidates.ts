import { createClient } from "@/lib/supabase/server";
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

    // 사용자의 투표 정보 조회
    const { data: votes, error: votesError } = await supabase
      .from("candidate_votes")
      .select("candidate_id, vote_type")
      .eq("user_id", currentUserId)
      .in(
        "candidate_id",
        candidates.map((c) => c.id),
      );

    if (votesError) {
      throw new Error(`투표 정보 조회 실패: ${votesError.message}`);
    }

    // 사용자 투표를 Map으로 변환 (빠른 조회)
    const userVoteMap = new Map((votes || []).map((v) => [v.candidate_id, v.vote_type]));

    // 후보지에 사용자 투표 정보 추가 및 찬성 비율 계산
    const candidatesWithVotes: CandidateWithUserVote[] = candidates.map((candidate) => {
      const total = candidate.votes_agree + candidate.votes_disagree;
      const agreement_ratio = total === 0 ? 0 : (candidate.votes_agree / total) * 100;

      return {
        ...candidate,
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
    const supabase = await createClient();

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

    // 투표 취소 (voteType이 null 또는 기존 투표와 동일한 경우)
    if (voteType === null || (existingVote && existingVote.vote_type === voteType)) {
      if (existingVote) {
        const { error: deleteError } = await supabase
          .from("candidate_votes")
          .delete()
          .eq("id", existingVote.id);

        if (deleteError) {
          throw new Error(`투표 취소 실패: ${deleteError.message}`);
        }
      }
    } else if (existingVote) {
      // 투표 변경 (기존 투표가 있고 다른 유형)
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

    // 업데이트된 후보지 정보 조회
    const { data: updatedCandidate, error: candidateError } = await supabase
      .from("candidates")
      .select("votes_agree, votes_disagree")
      .eq("id", candidateId)
      .single();

    if (candidateError) {
      throw new Error(`후보지 정보 조회 실패: ${candidateError.message}`);
    }

    if (!updatedCandidate) {
      throw new Error("후보지를 찾을 수 없습니다.");
    }

    // 업데이트된 사용자 투표 조회
    const { data: updatedUserVote } = await supabase
      .from("candidate_votes")
      .select("vote_type")
      .eq("candidate_id", candidateId)
      .eq("user_id", userId)
      .maybeSingle();

    const total = updatedCandidate.votes_agree + updatedCandidate.votes_disagree;
    const agreement_ratio = total === 0 ? 0 : (updatedCandidate.votes_agree / total) * 100;

    return {
      votes_agree: updatedCandidate.votes_agree,
      votes_disagree: updatedCandidate.votes_disagree,
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

    // 찬성 비율 계산
    const total = candidate.votes_agree + candidate.votes_disagree;
    const agreement_ratio = total === 0 ? 0 : (candidate.votes_agree / total) * 100;

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

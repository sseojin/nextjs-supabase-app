-- Phase 4: 후보지 등록 및 투표 시스템
-- candidates, candidate_votes, final_locations 테이블 생성
-- RLS 정책, 인덱스, 트리거, Realtime publication 설정

-- ============================================================
-- 1. Candidates 테이블 생성 (후보지 저장)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  address TEXT NOT NULL,
  category TEXT,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  votes_agree INT NOT NULL DEFAULT 0,
  votes_disagree INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 코멘트 추가
COMMENT ON TABLE public.candidates IS '프로젝트별 후보지 테이블';
COMMENT ON COLUMN public.candidates.id IS '후보지 고유 ID (UUID)';
COMMENT ON COLUMN public.candidates.project_id IS '프로젝트 ID (FK)';
COMMENT ON COLUMN public.candidates.location_name IS '장소명';
COMMENT ON COLUMN public.candidates.address IS '주소';
COMMENT ON COLUMN public.candidates.category IS '카테고리 (음식점, 카페, 영화관 등)';
COMMENT ON COLUMN public.candidates.lat IS '위도';
COMMENT ON COLUMN public.candidates.lng IS '경도';
COMMENT ON COLUMN public.candidates.created_by IS '후보지 등록자 (FK)';
COMMENT ON COLUMN public.candidates.votes_agree IS '찬성 투표 수';
COMMENT ON COLUMN public.candidates.votes_disagree IS '반대 투표 수';
COMMENT ON COLUMN public.candidates.created_at IS '생성 시간';
COMMENT ON COLUMN public.candidates.updated_at IS '마지막 수정 시간';

-- ============================================================
-- 2. Candidate Votes 테이블 생성 (투표 기록)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.candidate_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('agree', 'disagree')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, user_id)
);

-- 코멘트 추가
COMMENT ON TABLE public.candidate_votes IS '후보지 투표 기록 테이블';
COMMENT ON COLUMN public.candidate_votes.id IS '투표 고유 ID';
COMMENT ON COLUMN public.candidate_votes.candidate_id IS '후보지 ID (FK)';
COMMENT ON COLUMN public.candidate_votes.user_id IS '투표자 사용자 ID (FK)';
COMMENT ON COLUMN public.candidate_votes.vote_type IS '투표 유형 (agree: 찬성, disagree: 반대)';
COMMENT ON COLUMN public.candidate_votes.created_at IS '투표 생성 시간';
COMMENT ON COLUMN public.candidate_votes.updated_at IS '투표 수정 시간';

-- ============================================================
-- 3. Final Locations 테이블 생성 (최종 선정 장소)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.final_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  address TEXT NOT NULL,
  category TEXT,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  votes_agree INT NOT NULL,
  votes_disagree INT NOT NULL,
  agreement_ratio NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, candidate_id)
);

-- 코멘트 추가
COMMENT ON TABLE public.final_locations IS '최종 선정된 장소 테이블 (찬성 >= 66%)';
COMMENT ON COLUMN public.final_locations.id IS '최종 장소 고유 ID';
COMMENT ON COLUMN public.final_locations.project_id IS '프로젝트 ID (FK)';
COMMENT ON COLUMN public.final_locations.candidate_id IS '후보지 ID (FK)';
COMMENT ON COLUMN public.final_locations.location_name IS '장소명';
COMMENT ON COLUMN public.final_locations.address IS '주소';
COMMENT ON COLUMN public.final_locations.category IS '카테고리';
COMMENT ON COLUMN public.final_locations.lat IS '위도';
COMMENT ON COLUMN public.final_locations.lng IS '경도';
COMMENT ON COLUMN public.final_locations.votes_agree IS '찬성 투표 수';
COMMENT ON COLUMN public.final_locations.votes_disagree IS '반대 투표 수';
COMMENT ON COLUMN public.final_locations.agreement_ratio IS '찬성 비율 (0-100)';
COMMENT ON COLUMN public.final_locations.created_at IS '저장 시간';
COMMENT ON COLUMN public.final_locations.updated_at IS '수정 시간';

-- ============================================================
-- 4. 인덱스 생성 (성능 최적화)
-- ============================================================

-- 프로젝트별 후보지 조회 최적화
CREATE INDEX IF NOT EXISTS idx_candidates_project_id ON public.candidates(project_id);

-- 후보지 생성자별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_candidates_created_by ON public.candidates(created_by);

-- 투표자별 투표 조회 최적화
CREATE INDEX IF NOT EXISTS idx_candidate_votes_user_id ON public.candidate_votes(user_id);

-- 후보지별 투표 조회 최적화
CREATE INDEX IF NOT EXISTS idx_candidate_votes_candidate_id ON public.candidate_votes(candidate_id);

-- 프로젝트별 최종 장소 조회 최적화
CREATE INDEX IF NOT EXISTS idx_final_locations_project_id ON public.final_locations(project_id);

-- ============================================================
-- 5. RLS (Row Level Security) 정책 설정
-- ============================================================

-- candidates 테이블 RLS 활성화
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- candidates SELECT: 프로젝트 멤버만 조회 가능
CREATE POLICY "candidates_select_policy" ON public.candidates
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- candidates INSERT: 프로젝트 멤버만 후보지 등록 가능
CREATE POLICY "candidates_insert_policy" ON public.candidates
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- candidates UPDATE: 후보지 등록자 또는 프로젝트 creator만 수정 가능
-- (투표 수 업데이트는 트리거로 자동)
CREATE POLICY "candidates_update_policy" ON public.candidates
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role = 'creator'
    )
  );

-- candidates DELETE: 후보지 등록자 또는 모든 프로젝트 멤버 삭제 가능
CREATE POLICY "candidates_delete_policy" ON public.candidates
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- candidate_votes 테이블 RLS 활성화
ALTER TABLE public.candidate_votes ENABLE ROW LEVEL SECURITY;

-- candidate_votes SELECT: 프로젝트 멤버만 조회 가능
CREATE POLICY "candidate_votes_select_policy" ON public.candidate_votes
  FOR SELECT
  USING (
    candidate_id IN (
      SELECT id FROM public.candidates
      WHERE project_id IN (
        SELECT project_id FROM public.project_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- candidate_votes INSERT: 프로젝트 멤버만 투표 가능
CREATE POLICY "candidate_votes_insert_policy" ON public.candidate_votes
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND candidate_id IN (
      SELECT id FROM public.candidates
      WHERE project_id IN (
        SELECT project_id FROM public.project_members
        WHERE user_id = auth.uid()
      )
    )
    AND user_id = auth.uid()
  );

-- candidate_votes UPDATE: 투표자 본인만 수정 가능 (투표 변경)
CREATE POLICY "candidate_votes_update_policy" ON public.candidate_votes
  FOR UPDATE
  USING (user_id = auth.uid());

-- candidate_votes DELETE: 투표자 본인만 삭제 가능 (투표 취소)
CREATE POLICY "candidate_votes_delete_policy" ON public.candidate_votes
  FOR DELETE
  USING (user_id = auth.uid());

-- final_locations 테이블 RLS 활성화
ALTER TABLE public.final_locations ENABLE ROW LEVEL SECURITY;

-- final_locations SELECT: 프로젝트 멤버만 조회 가능
CREATE POLICY "final_locations_select_policy" ON public.final_locations
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- final_locations INSERT: 서버 측 API에서만 자동 삽입 (RLS는 열린 상태로 유지)
-- 실제 삽입은 API가 관리하므로, 클라이언트는 직접 호출하지 않음
CREATE POLICY "final_locations_insert_policy" ON public.final_locations
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- final_locations DELETE: 서버 측 API에서만 자동 삭제
CREATE POLICY "final_locations_delete_policy" ON public.final_locations
  FOR DELETE
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. 트리거 및 함수 (자동 갱신)
-- ============================================================

-- candidates 테이블 updated_at 트리거
CREATE TRIGGER trigger_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- candidate_votes 테이블 updated_at 트리거
CREATE TRIGGER trigger_candidate_votes_updated_at
  BEFORE UPDATE ON public.candidate_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- final_locations 테이블 updated_at 트리거
CREATE TRIGGER trigger_final_locations_updated_at
  BEFORE UPDATE ON public.final_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 7. Realtime Publication 설정 (Phase 5 준비)
-- ============================================================

-- candidates 테이블을 Realtime publication에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;

-- candidate_votes 테이블을 Realtime publication에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidate_votes;

-- final_locations 테이블을 Realtime publication에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE public.final_locations;

-- ============================================================
-- 8. Grant 권한 설정 (authenticated 사용자에게)
-- ============================================================

-- authenticated 사용자에게 테이블 접근 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.final_locations TO authenticated;

-- ============================================================
-- End of Phase 4 Schema
-- ============================================================

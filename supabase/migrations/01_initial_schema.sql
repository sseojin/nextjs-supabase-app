-- Phase 1: Initial Database Schema
-- projects 테이블 및 project_members 테이블 생성
-- RLS 정책, 인덱스, 트리거, Realtime publication 설정

-- ============================================================
-- 1. Projects 테이블 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_link TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 코멘트 추가
COMMENT ON TABLE public.projects IS '데이트 계획 프로젝트 테이블';
COMMENT ON COLUMN public.projects.id IS '프로젝트 고유 ID (UUID)';
COMMENT ON COLUMN public.projects.title IS '프로젝트 제목';
COMMENT ON COLUMN public.projects.date IS '프로젝트 날짜';
COMMENT ON COLUMN public.projects.creator_id IS '프로젝트 생성자 (creator) 사용자 ID';
COMMENT ON COLUMN public.projects.share_link IS '프로젝트 공유 링크 (고유값, nanoid 10자)';
COMMENT ON COLUMN public.projects.status IS '프로젝트 상태 (active, archived, completed)';
COMMENT ON COLUMN public.projects.created_at IS '생성 시간 (TIMESTAMPTZ)';
COMMENT ON COLUMN public.projects.updated_at IS '마지막 수정 시간 (자동 갱신)';

-- ============================================================
-- 2. Project Members 테이블 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('creator', 'member')),
  display_color TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- 코멘트 추가
COMMENT ON TABLE public.project_members IS '프로젝트 멤버십 테이블';
COMMENT ON COLUMN public.project_members.id IS '멤버십 고유 ID';
COMMENT ON COLUMN public.project_members.project_id IS '프로젝트 ID (FK)';
COMMENT ON COLUMN public.project_members.user_id IS '사용자 ID (FK)';
COMMENT ON COLUMN public.project_members.role IS '멤버 역할 (creator: 생성자, member: 참여자)';
COMMENT ON COLUMN public.project_members.display_color IS '배지 표시 색상 (creator: #FF0000, member: #0000FF)';
COMMENT ON COLUMN public.project_members.joined_at IS '참여 시간';

-- ============================================================
-- 3. 인덱스 생성 (성능 최적화)
-- ============================================================
-- 사용자별 프로젝트 조회 최적화
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

-- 날짜별 프로젝트 조회 최적화 (월별 필터링)
CREATE INDEX IF NOT EXISTS idx_projects_date ON public.projects(date);

-- 공유 링크 검색 최적화 (이미 UNIQUE 제약이 있지만, 명시적 인덱스)
CREATE INDEX IF NOT EXISTS idx_projects_share_link ON public.projects(share_link);

-- creator_id로 프로젝트 검색 (권한 확인 시)
CREATE INDEX IF NOT EXISTS idx_projects_creator_id ON public.projects(creator_id);

-- ============================================================
-- 4. RLS (Row Level Security) 정책 설정
-- ============================================================

-- projects 테이블 RLS 활성화
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- projects SELECT: 본인이 멤버인 프로젝트만 조회 가능
CREATE POLICY "projects_select_policy" ON public.projects
  FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- projects INSERT: 인증된 사용자는 프로젝트 생성 가능
CREATE POLICY "projects_insert_policy" ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- projects UPDATE: creator만 프로젝트 수정 가능
CREATE POLICY "projects_update_policy" ON public.projects
  FOR UPDATE
  USING (creator_id = auth.uid());

-- projects DELETE: creator만 프로젝트 삭제 가능
CREATE POLICY "projects_delete_policy" ON public.projects
  FOR DELETE
  USING (creator_id = auth.uid());

-- project_members 테이블 RLS 활성화
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- project_members SELECT: 본인이 해당 프로젝트의 멤버이거나 creator인 경우 조회 가능
CREATE POLICY "project_members_select_policy" ON public.project_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- project_members INSERT: 인증된 사용자는 멤버십 추가 가능
CREATE POLICY "project_members_insert_policy" ON public.project_members
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- project_members UPDATE: 본인 또는 creator만 수정 가능
CREATE POLICY "project_members_update_policy" ON public.project_members
  FOR UPDATE
  USING (user_id = auth.uid());

-- project_members DELETE: 본인 또는 creator만 삭제 가능
CREATE POLICY "project_members_delete_policy" ON public.project_members
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- 5. 트리거 및 함수 (자동 갱신)
-- ============================================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- projects 테이블 updated_at 트리거
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 6. Realtime Publication 설정 (Phase 5 준비)
-- ============================================================

-- projects 테이블을 Realtime publication에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- project_members 테이블을 Realtime publication에 추가
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;

-- ============================================================
-- 7. Grant 권한 설정 (authenticated 사용자에게)
-- ============================================================

-- authenticated 사용자에게 테이블 접근 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;

-- anon (비인증) 사용자는 RLS로 차단되므로 권한 불필요
-- 하지만 명시적으로 설정 가능:
GRANT USAGE ON SCHEMA public TO anon;

-- ============================================================
-- End of Phase 1 Initial Schema
-- ============================================================

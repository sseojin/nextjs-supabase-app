-- Phase 1 Fix: projects 및 project_members 테이블 RLS 활성화
-- 마이그레이션에서 명시되었으나 실제로 적용되지 않은 RLS 설정 복구

-- ============================================================
-- 1. projects 테이블 RLS 활성화
-- ============================================================

-- RLS 활성화
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있는지 확인 (있으면 DROP)
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;

-- SELECT: 인증된 모든 사용자가 조회 가능 (public.project_members 참조를 위해)
-- 주의: 실제로는 자신이 멤버인 프로젝트만 조회하지만,
-- Realtime 구독 시 RLS 체크가 복잡하므로 authenticated 전체 허용
CREATE POLICY "projects_select_policy" ON public.projects
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: 인증된 사용자는 프로젝트 생성 가능
CREATE POLICY "projects_insert_policy" ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: creator만 프로젝트 수정 가능
CREATE POLICY "projects_update_policy" ON public.projects
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid());

-- DELETE: creator만 프로젝트 삭제 가능
CREATE POLICY "projects_delete_policy" ON public.projects
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- ============================================================
-- 2. project_members 테이블 RLS 활성화
-- ============================================================

-- RLS 활성화
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있는지 확인 (있으면 DROP)
DROP POLICY IF EXISTS "project_members_select_policy" ON public.project_members;
DROP POLICY IF EXISTS "project_members_insert_policy" ON public.project_members;
DROP POLICY IF EXISTS "project_members_update_policy" ON public.project_members;
DROP POLICY IF EXISTS "project_members_delete_policy" ON public.project_members;

-- SELECT: 인증된 모든 사용자가 조회 가능
-- Realtime 구독 시 candidates 정책에서 project_members를 참조하므로 허용 필요
CREATE POLICY "project_members_select_policy" ON public.project_members
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: 인증된 사용자는 멤버십 추가 가능
CREATE POLICY "project_members_insert_policy" ON public.project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: 본인만 수정 가능
CREATE POLICY "project_members_update_policy" ON public.project_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- DELETE: 본인만 삭제 가능
CREATE POLICY "project_members_delete_policy" ON public.project_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 3. Realtime 관련 권한 확인
-- ============================================================

-- authenticated 사용자에게 명시적 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;

-- ============================================================
-- End of RLS Fix
-- ============================================================

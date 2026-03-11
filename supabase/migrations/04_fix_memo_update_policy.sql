-- ============================================================
-- Migration: 메모 수정 권한 수정
-- 모든 프로젝트 멤버가 후보지 메모를 수정할 수 있도록 변경
-- ============================================================

-- 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "candidates_update_policy" ON public.candidates;

-- 새로운 UPDATE 정책: 모든 프로젝트 멤버가 수정 가능
-- (메모, 투표 수 등을 업데이트할 수 있음)
CREATE POLICY "candidates_update_policy" ON public.candidates
  FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- 설명:
-- 1. 이전: 후보지 등록자 또는 creator만 수정 가능
-- 2. 현재: 모든 프로젝트 멤버가 수정 가능
-- 3. 이유: 협업 기능 강화 (멤버들이 메모를 자유롭게 추가/수정)
-- 4. 보안: project_members 테이블 조인으로 프로젝트 멤버만 수정 가능

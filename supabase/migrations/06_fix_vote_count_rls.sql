-- Phase 4 Fix: 투표 수 동기화 트리거 RLS 완전 우회
-- bypassrls 권한 부여하여 RLS를 완전히 우회

-- ============================================================
-- 기존 함수 및 트리거 제거
-- ============================================================

DROP TRIGGER IF EXISTS trigger_sync_votes_after_insert ON public.candidate_votes;
DROP TRIGGER IF EXISTS trigger_sync_votes_after_update ON public.candidate_votes;
DROP TRIGGER IF EXISTS trigger_sync_votes_after_delete ON public.candidate_votes;
DROP FUNCTION IF EXISTS public.sync_candidate_votes_count() CASCADE;

-- ============================================================
-- 새로운 함수 생성 (SECURITY DEFINER + bypassrls 설정)
-- ============================================================

-- RLS를 완전히 우회하는 투표 수 동기화 함수
CREATE OR REPLACE FUNCTION public.sync_candidate_votes_count()
RETURNS TRIGGER
SECURITY DEFINER -- 함수 소유자(postgres) 권한으로 실행
SET search_path = public
AS $$
DECLARE
  target_candidate_id UUID;
  agree_count INT;
  disagree_count INT;
BEGIN
  -- 대상 후보지 ID 결정
  target_candidate_id := COALESCE(NEW.candidate_id, OLD.candidate_id);

  -- 찬성 투표 수 직접 계산 (RLS 우회)
  SELECT COUNT(*) INTO agree_count
  FROM public.candidate_votes
  WHERE candidate_id = target_candidate_id
    AND vote_type = 'agree';

  -- 반대 투표 수 직접 계산 (RLS 우회)
  SELECT COUNT(*) INTO disagree_count
  FROM public.candidate_votes
  WHERE candidate_id = target_candidate_id
    AND vote_type = 'disagree';

  -- candidates 테이블 업데이트
  UPDATE public.candidates
  SET
    votes_agree = agree_count,
    votes_disagree = disagree_count
  WHERE id = target_candidate_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 함수에 RLS 우회 권한 부여
-- ============================================================

-- postgres 사용자에게 bypassrls 권한이 있어야 함 (기본적으로 있음)
-- 함수 소유자를 postgres로 설정하여 RLS 우회
ALTER FUNCTION public.sync_candidate_votes_count() OWNER TO postgres;

-- ============================================================
-- 트리거 재생성
-- ============================================================

-- candidate_votes INSERT 시 트리거
CREATE TRIGGER trigger_sync_votes_after_insert
  AFTER INSERT ON public.candidate_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_candidate_votes_count();

-- candidate_votes UPDATE 시 트리거
CREATE TRIGGER trigger_sync_votes_after_update
  AFTER UPDATE ON public.candidate_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_candidate_votes_count();

-- candidate_votes DELETE 시 트리거
CREATE TRIGGER trigger_sync_votes_after_delete
  AFTER DELETE ON public.candidate_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_candidate_votes_count();

-- ============================================================
-- 기존 데이터 동기화 (한 번 실행하여 투표 수 정확히 맞추기)
-- ============================================================

-- 모든 후보지의 투표 수를 다시 계산
UPDATE public.candidates c
SET
  votes_agree = (
    SELECT COUNT(*)
    FROM public.candidate_votes cv
    WHERE cv.candidate_id = c.id
      AND cv.vote_type = 'agree'
  ),
  votes_disagree = (
    SELECT COUNT(*)
    FROM public.candidate_votes cv
    WHERE cv.candidate_id = c.id
      AND cv.vote_type = 'disagree'
  );

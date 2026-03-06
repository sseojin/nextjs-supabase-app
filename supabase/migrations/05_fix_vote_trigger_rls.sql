-- Phase 4 Fix: 투표 수 동기화 트리거 RLS 문제 해결
-- 트리거 함수를 SECURITY DEFINER로 변경하여 RLS를 우회

-- ============================================================
-- 트리거 함수 재생성 (SECURITY DEFINER 추가)
-- ============================================================

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS public.sync_candidate_votes_count() CASCADE;

-- 새로운 함수 생성 (SECURITY DEFINER)
-- SECURITY DEFINER를 사용하면 함수 소유자(postgres)의 권한으로 실행되어 RLS를 우회합니다
CREATE OR REPLACE FUNCTION public.sync_candidate_votes_count()
RETURNS TRIGGER
SECURITY DEFINER -- ← 중요: RLS 우회
SET search_path = public
AS $$
BEGIN
  -- INSERT 또는 UPDATE 또는 DELETE 후 해당 후보지의 투표 수 갱신
  UPDATE public.candidates
  SET
    votes_agree = (
      SELECT COUNT(*) FROM public.candidate_votes
      WHERE candidate_id = COALESCE(NEW.candidate_id, OLD.candidate_id)
      AND vote_type = 'agree'
    ),
    votes_disagree = (
      SELECT COUNT(*) FROM public.candidate_votes
      WHERE candidate_id = COALESCE(NEW.candidate_id, OLD.candidate_id)
      AND vote_type = 'disagree'
    )
  WHERE id = COALESCE(NEW.candidate_id, OLD.candidate_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

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

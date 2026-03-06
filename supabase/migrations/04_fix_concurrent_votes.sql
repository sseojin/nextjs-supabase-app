-- Phase 4 Fix: 동시성 투표 문제 해결
-- candidate_votes 변경 시 candidates 테이블의 투표 수를 자동으로 갱신하는 트리거 추가

-- ============================================================
-- 동시성 문제 해결: 트리거 기반 투표 수 자동 동기화
-- ============================================================

-- candidate_votes 변경 시 candidates 테이블의 투표 수를 자동으로 갱신하는 함수
CREATE OR REPLACE FUNCTION public.sync_candidate_votes_count()
RETURNS TRIGGER AS $$
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

-- 기존 트리거 제거 (있으면)
DROP TRIGGER IF EXISTS trigger_sync_votes_after_insert ON public.candidate_votes;
DROP TRIGGER IF EXISTS trigger_sync_votes_after_update ON public.candidate_votes;
DROP TRIGGER IF EXISTS trigger_sync_votes_after_delete ON public.candidate_votes;

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

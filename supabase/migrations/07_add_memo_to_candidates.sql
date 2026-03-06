-- 후보지 테이블에 메모 컬럼 추가
-- 사용자가 후보지 등록 시 남긴 메모를 저장

ALTER TABLE public.candidates
ADD COLUMN memo TEXT;

-- 코멘트 추가
COMMENT ON COLUMN public.candidates.memo IS '후보지에 대한 사용자 메모 (선택사항, 최대 200자)';

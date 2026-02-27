-- projects 테이블에 location 컬럼 추가
ALTER TABLE public.projects ADD COLUMN location TEXT;

-- 새로운 프로젝트의 location 필드를 선택적으로 설정하도록 인덱스 추가
CREATE INDEX idx_projects_location ON public.projects(location);

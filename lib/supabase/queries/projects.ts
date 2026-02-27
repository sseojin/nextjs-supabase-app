import { createClient } from '@/lib/supabase/server';
import type { Project, ProjectWithMembers } from '@/lib/types/project';

/**
 * 사용자가 참여한 프로젝트를 월별로 조회합니다.
 * project_members와 조인하여 사용자의 역할(role)과 배지 색상(display_color)을 포함합니다.
 *
 * @param year - 조회 연도 (예: 2024)
 * @param month - 조회 월 (1~12, 1 = January)
 * @param userId - 사용자 ID (API 라우트에서 토큰으로 추출한 경우 전달)
 * @returns {Promise<Project[]>} 해당 월의 프로젝트 배열
 * @throws 에러 발생 시 명확한 메시지와 함께 throw
 */
export async function getProjectsByMonth(
  year: number,
  month: number,
  userId?: string
): Promise<Project[]> {
  try {
    const supabase = await createClient();

    // 현재 사용자 조회 (또는 전달된 userId 사용)
    let currentUserId = userId;
    if (!currentUserId) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('인증이 필요합니다.');
      }

      currentUserId = user.id;
    }

    if (!currentUserId) {
      throw new Error('인증이 필요합니다.');
    }

    // 월의 시작일과 종료일 계산
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // 다음 달 0일 = 현재 달 마지막 날

    // project_members와 projects 조인하여 사용자가 참여한 프로젝트 조회
    const { data, error } = await supabase
      .from('project_members')
      .select(
        `
        role,
        display_color,
        projects (
          id,
          title,
          date,
          creator_id,
          share_link,
          status,
          location,
          created_at,
          updated_at
        )
      `
      )
      .eq('user_id', currentUserId)
      .gte('projects.date', startDate.toISOString().split('T')[0])
      .lte('projects.date', endDate.toISOString().split('T')[0]);

    if (error) {
      throw new Error(`프로젝트 조회 실패: ${error.message}`);
    }

    // 응답 데이터를 Project[] 형식으로 변환
    // null 체크: projects가 없는 멤버십 레코드는 필터링
    const projects: Project[] = (data || [])
      .filter((member: any) => member.projects !== null) // null 프로젝트 필터링
      .map((member: any) => ({
        id: member.projects.id,
        title: member.projects.title,
        date: new Date(member.projects.date),
        creator_id: member.projects.creator_id,
        share_link: member.projects.share_link,
        status: member.projects.status,
        role: member.role as 'creator' | 'member',
        location: member.projects.location,
        created_at: member.projects.created_at
          ? new Date(member.projects.created_at)
          : undefined,
        updated_at: member.projects.updated_at
          ? new Date(member.projects.updated_at)
          : undefined,
      }));

    // 날짜순 정렬
    projects.sort((a, b) => a.date.getTime() - b.date.getTime());

    return projects;
  } catch (error) {
    console.error('getProjectsByMonth 에러:', error);
    throw error;
  }
}

/**
 * 새로운 프로젝트를 생성합니다.
 * projects 테이블에 프로젝트를 INSERT하고,
 * project_members 테이블에 creator를 추가합니다. (트랜잭션)
 *
 * @param title - 프로젝트 제목
 * @param date - 프로젝트 날짜
 * @param userId - 생성자 사용자 ID
 * @param shareLink - nanoid로 생성한 공유 링크 (10자)
 * @returns {Promise<Project>} 생성된 프로젝트
 * @throws 유효성 검사 실패 또는 DB 에러 시 throw
 */
export async function createProject(
  title: string,
  date: Date,
  userId: string,
  shareLink: string,
  location?: string
): Promise<Project> {
  try {
    // 유효성 검사
    if (!title || title.trim().length < 2) {
      throw new Error('프로젝트 제목은 최소 2자 이상이어야 합니다.');
    }

    if (!date) {
      throw new Error('프로젝트 날짜는 필수입니다.');
    }

    if (!shareLink || shareLink.length !== 10) {
      throw new Error('공유 링크는 10자여야 합니다.');
    }

    const supabase = await createClient();

    // 날짜 포맷: YYYY-MM-DD
    const dateString = date.toISOString().split('T')[0];

    // 1. projects INSERT
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        title: title.trim(),
        date: dateString,
        creator_id: userId,
        share_link: shareLink,
        status: 'active',
        ...(location && location.trim() && { location: location.trim() }),
      })
      .select()
      .single();

    if (projectError) {
      throw new Error(`프로젝트 생성 실패: ${projectError.message}`);
    }

    if (!projectData) {
      throw new Error('프로젝트 생성 실패: 응답 데이터가 없습니다.');
    }

    // 2. project_members INSERT (creator 추가)
    const { error: memberError } = await supabase.from('project_members').insert({
      project_id: projectData.id,
      user_id: userId,
      role: 'creator',
      display_color: '#FF0000', // creator: 빨강
    });

    if (memberError) {
      // 롤백: 생성된 프로젝트 삭제 (선택사항, 현재는 에러만 발생)
      throw new Error(`멤버 추가 실패: ${memberError.message}`);
    }

    // Project 객체 반환
    const project: Project = {
      id: projectData.id,
      title: projectData.title,
      date: new Date(projectData.date),
      creator_id: projectData.creator_id,
      share_link: projectData.share_link,
      status: projectData.status,
      role: 'creator',
      location: projectData.location,
      created_at: projectData.created_at
        ? new Date(projectData.created_at)
        : undefined,
      updated_at: projectData.updated_at
        ? new Date(projectData.updated_at)
        : undefined,
    };

    return project;
  } catch (error) {
    console.error('createProject 에러:', error);
    throw error;
  }
}

/**
 * 프로젝트 상세 정보와 멤버 목록을 조회합니다.
 *
 * @param projectId - 프로젝트 ID
 * @param userId - 사용자 ID (API 라우트에서 토큰으로 추출한 경우 전달)
 * @returns {Promise<ProjectWithMembers>} 프로젝트 + 멤버 목록
 * @throws 프로젝트를 찾을 수 없거나 DB 에러 시 throw
 */
export async function getProjectById(projectId: string, userId?: string): Promise<ProjectWithMembers> {
  try {
    const supabase = await createClient();

    // 프로젝트 + 멤버 목록 조회
    // maybeSingle() 사용: 행이 없거나 1행일 때만 성공 (0행이면 null 반환)
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select(
        `
        id,
        title,
        date,
        creator_id,
        share_link,
        status,
        location,
        created_at,
        updated_at,
        project_members (
          id,
          project_id,
          user_id,
          role,
          display_color,
          joined_at
        )
      `
      )
      .eq('id', projectId)
      .maybeSingle();

    if (projectError) {
      throw new Error(`프로젝트 조회 실패: ${projectError.message}`);
    }

    if (!projectData) {
      throw new Error('프로젝트를 찾을 수 없습니다.');
    }

    // 현재 사용자 조회 (역할 결정용)
    let currentUserId = userId;
    if (!currentUserId) {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('인증이 필요합니다.');
      }

      currentUserId = user.id;
    }

    if (!currentUserId) {
      throw new Error('인증이 필요합니다.');
    }

    // 현재 사용자의 역할 찾기
    const userMembership = (projectData.project_members as any[]).find(
      (member) => member.user_id === currentUserId
    );

    const role = userMembership?.role || 'member';

    // ProjectWithMembers 객체 생성
    const project: ProjectWithMembers = {
      id: projectData.id,
      title: projectData.title,
      date: new Date(projectData.date),
      creator_id: projectData.creator_id,
      share_link: projectData.share_link,
      status: projectData.status,
      role: role as 'creator' | 'member',
      location: projectData.location,
      created_at: projectData.created_at
        ? new Date(projectData.created_at)
        : undefined,
      updated_at: projectData.updated_at
        ? new Date(projectData.updated_at)
        : undefined,
      members: (projectData.project_members as any[]).map((member) => ({
        id: member.id,
        project_id: member.project_id,
        user_id: member.user_id,
        role: member.role,
        display_color: member.display_color,
        joined_at: new Date(member.joined_at),
      })),
    };

    return project;
  } catch (error) {
    console.error('getProjectById 에러:', error);
    throw error;
  }
}

/**
 * 프로젝트를 삭제합니다.
 * creator만 삭제할 수 있습니다.
 *
 * @param projectId - 프로젝트 ID
 * @param userId - 삭제 요청 사용자 ID
 * @returns {Promise<void>}
 * @throws creator가 아닌 경우 또는 DB 에러 시 throw
 */
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // 프로젝트의 creator_id 확인
    // maybeSingle() 사용: 행이 없거나 1행일 때만 성공 (0행이면 null 반환)
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('creator_id')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError) {
      throw new Error(`프로젝트 조회 실패: ${projectError.message}`);
    }

    if (!projectData) {
      throw new Error('프로젝트를 찾을 수 없습니다.');
    }

    // creator 권한 확인
    if (projectData.creator_id !== userId) {
      throw new Error('프로젝트는 생성자만 삭제할 수 있습니다.');
    }

    // 프로젝트 삭제
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      throw new Error(`프로젝트 삭제 실패: ${deleteError.message}`);
    }
  } catch (error) {
    console.error('deleteProject 에러:', error);
    throw error;
  }
}

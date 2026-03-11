"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { ProjectWithMembers } from "@/lib/types/project";
import type { LocationSearchResult, AddLocationData } from "@/lib/types/location";
import type { CandidateWithUserVote } from "@/lib/types/candidate";
import ShareLinkButton from "@/components/projects/ShareLinkButton";
import MemberList from "@/components/projects/MemberList";
import CandidateList from "@/components/projects/CandidateList";
import LocationSearch from "@/components/map/LocationSearch";
import NaverMap from "@/components/map/NaverMap";
import AddLocationModal from "@/components/map/AddLocationModal";
import NaverMapScript from "@/components/NaverMapScript";
import { RealtimeProvider, useRealtimeContext } from "@/components/realtime/RealtimeProvider";

/**
 * Phase 5: 후보지 등록 모달 래퍼 컴포넌트
 * RealtimeProvider 내부에서 후보지 목록에 접근하기 위한 래퍼
 */
function AddLocationModalWrapper({
  isOpen,
  location,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  location: LocationSearchResult | null;
  onClose: () => void;
  onSubmit: (data: AddLocationData) => Promise<AddLocationData>;
}) {
  const { candidates } = useRealtimeContext();

  return (
    <AddLocationModal
      isOpen={isOpen}
      location={location}
      onClose={onClose}
      onSubmit={onSubmit}
      existingLocationNames={candidates.map((c: CandidateWithUserVote) => c.location_name)}
    />
  );
}

/**
 * 프로젝트 상세 페이지
 * Phase 1: 기본 프로젝트 정보와 멤버 목록 표시
 * Phase 2: 공유 링크 복사, 참여 기능 추가
 * Phase 3: 네이버 지도 추가
 * Phase 5: Realtime 동기화 추가
 */
export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const mapAreaRef = useRef<HTMLDivElement>(null);

  // URL 쿼리 파라미터에서 돌아갈 월 정보 가져오기
  const paramYear = searchParams.get("year");
  const paramMonth = searchParams.get("month");

  const [project, setProject] = useState<ProjectWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Phase 3: 네이버 지도 관련 상태
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [locationToAdd, setLocationToAdd] = useState<LocationSearchResult | null>(null);

  // Phase 4: 탭 시스템 상태
  const [activeTab, setActiveTab] = useState<"info" | "members" | "candidates">("info");

  // 지도 포커스용 좌표 상태
  const [focusCoordinates, setFocusCoordinates] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // 검색 결과 영역 참조 (배경 클릭 감지용)
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const showSearchResultsRef = useRef(showSearchResults);

  /**
   * 뒤로가기 핸들러
   * URL 파라미터에 year, month가 있으면 그 달로 이동
   * 없으면 대시보드로 이동
   */
  const handleGoBack = () => {
    if (paramYear && paramMonth) {
      router.push(`/dashboard?year=${paramYear}&month=${paramMonth}`);
    } else {
      router.push("/dashboard");
    }
  };

  /**
   * 프로젝트 상세 정보 조회
   */
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError("");

        // Supabase 세션에서 토큰 가져오기
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
        }

        const response = await fetch(`/api/projects/${projectId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          try {
            const errorData = await response.json();
            throw new Error(errorData?.error || "프로젝트를 불러올 수 없습니다");
          } catch {
            throw new Error(`프로젝트 조회 실패: HTTP ${response.status}`);
          }
        }

        const data = await response.json();
        setProject(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "프로젝트 조회 중 오류가 발생했습니다";
        setError(errorMessage);
        console.error("프로젝트 조회 에러:", err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Phase 5: RealtimeProvider가 후보지 데이터 관리
  // refetchCandidates 함수는 RealtimeProvider 내부의 useRealtimeCandidates에서 처리됨

  /**
   * showSearchResults 업데이트 시 ref도 함께 업데이트
   */
  useEffect(() => {
    showSearchResultsRef.current = showSearchResults;
  }, [showSearchResults]);

  /**
   * 검색 결과 배경 클릭 감지
   * 검색 영역(searchAreaRef) 밖을 클릭하면 검색 결과 목록만 닫기 (마커는 유지)
   * 단, 지도는 제외
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 검색 결과가 표시되지 않으면 리스너 무시
      if (!showSearchResultsRef.current) {
        return;
      }

      const target = event.target as Node;

      // 검색 영역 내부 클릭이면 무시
      if (searchAreaRef.current?.contains(target)) {
        return;
      }

      // 지도 영역(mapAreaRef)을 클릭했으면 무시
      if (mapAreaRef.current?.contains(target)) {
        return;
      }

      // 그 외의 곳을 클릭했으면 검색 결과 목록만 닫기
      setShowSearchResults(false);
    };

    // document에 클릭 이벤트 리스너 추가 (버블링 단계)
    document.addEventListener("click", handleClickOutside, false);

    return () => {
      document.removeEventListener("click", handleClickOutside, false);
    };
  }, []);

  /**
   * LocationSearch에서 검색 결과를 받아 처리
   * 첫 번째 결과를 자동으로 선택하고 결과 목록 표시
   */
  const handleSearchResults = useCallback((results: LocationSearchResult[]) => {
    setSearchResults(results);
    setShowSearchResults(true);
    if (results.length > 0) {
      setSelectedLocation(results[0]);
    }
  }, []);

  /**
   * NaverMap에서 마커 클릭 시 호출
   * 선택된 장소 업데이트
   */
  const handleLocationSelect = useCallback((location: LocationSearchResult | null) => {
    setSelectedLocation(location);
  }, []);

  /**
   * 검색 결과 항목을 클릭했을 때 호출
   * 선택된 위치를 업데이트하고 지도 영역으로 스크롤
   */
  const handleSelectLocationFromSearch = useCallback((location: LocationSearchResult) => {
    setSelectedLocation(location);
    // 지도 영역으로 부드럽게 스크롤 (검색창이 가려지지 않도록)
    setTimeout(() => {
      mapAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  /**
   * 검색 결과 닫기 (검색 목록, 검색 마커, InfoWindow 모두 제거)
   * 다시 검색하면 정상적으로 나타남
   */
  const handleCloseSearchResults = useCallback(() => {
    setShowSearchResults(false); // 검색 결과 목록 닫기
    setSearchResults([]); // 검색 마커 제거
    setSelectedLocation(null); // InfoWindow 제거
  }, []);

  /**
   * 후보지 카드 클릭 핸들러
   * 선정된 후보지(찬성 >= 66%)를 클릭하면 해당 위치로 지도 포커스
   */
  const handleCandidateClick = useCallback((candidate: CandidateWithUserVote) => {
    // 지도 영역으로 스크롤
    mapAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    // 지도를 해당 좌표로 포커스
    setFocusCoordinates({ lat: candidate.lat, lng: candidate.lng });
  }, []);

  /**
   * LocationInfoWindow의 "후보지 등록" 버튼 클릭 시
   * 모달을 열고 등록할 장소 설정
   */
  const handleAddLocationClick = useCallback(() => {
    if (selectedLocation) {
      setLocationToAdd(selectedLocation);
      setIsAddModalOpen(true);
    }
  }, [selectedLocation]);

  /**
   * AddLocationModal 제출 핸들러
   * POST /api/projects/{projectId}/candidates에 후보지 데이터를 전송합니다
   * 성공 시 AddLocationModal에서 토스트 알림과 모달 닫기 처리
   * 실패 시 에러를 throw하여 AddLocationModal의 에러 처리로 위임
   */
  const handleAddLocationSubmit = async (data: AddLocationData) => {
    try {
      // Supabase 세션에서 토큰 가져오기
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
      }

      // API가 요구하는 형식으로 데이터 변환
      const candidateData = {
        location_name: data.name,
        address: data.address,
        category: data.category,
        lat: data.latitude,
        lng: data.longitude,
        memo: data.memo,
      };

      // POST /api/projects/{projectId}/candidates 호출
      const response = await fetch(`/api/projects/${projectId}/candidates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(candidateData),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData?.error || "후보지 등록에 실패했습니다");
        } catch {
          throw new Error(`후보지 등록 실패: HTTP ${response.status}`);
        }
      }

      // 성공 시 응답 데이터 반환 (토스트는 AddLocationModal에서 처리)
      const result = await response.json();

      // Phase 5: RealtimeProvider가 자동으로 후보지 데이터 업데이트
      // 수동 refetch 제거 (Realtime Realtime INSERT 이벤트로 자동 동기화됨)

      // 등록 성공 후 검색 결과 초기화 (검색 마커와 InfoWindow 제거)
      setSearchResults([]);
      setSelectedLocation(null);
      setShowSearchResults(false);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "후보지 등록 중 오류가 발생했습니다";
      console.error("후보지 등록 에러:", error);
      throw new Error(errorMessage);
    }
  };

  /**
   * 프로젝트 삭제 핸들러
   * creator만 삭제 가능
   */
  const handleDelete = async () => {
    try {
      setDeleting(true);

      // Supabase 세션에서 토큰 가져오기
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData?.error || "프로젝트 삭제에 실패했습니다");
        } catch {
          throw new Error(`프로젝트 삭제 실패: HTTP ${response.status}`);
        }
      }

      // 성공 알림
      toast.success("프로젝트가 삭제되었습니다");

      // 모달 닫고 프로젝트의 날짜 기반으로 해당 월 캘린더로 이동
      setShowDeleteDialog(false);
      setTimeout(() => {
        if (project) {
          const projectDate = new Date(project.date);
          const year = projectDate.getFullYear();
          const month = projectDate.getMonth() + 1;
          router.push(`/dashboard?year=${year}&month=${month}`);
        } else {
          router.push("/dashboard");
        }
      }, 300);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "프로젝트 삭제 중 오류가 발생했습니다";
      toast.error(errorMessage);
      console.error("프로젝트 삭제 에러:", err);
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>프로젝트를 불러오는 중...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">오류 발생</h2>
          <p className="text-slate-600 mb-4">{error || "프로젝트를 찾을 수 없습니다"}</p>
          <Button onClick={handleGoBack}>뒤로 가기</Button>
        </div>
      </div>
    );
  }

  const formattedDate = format(new Date(project.date), "yyyy년 M월 d일 (EEEE)", {
    locale: ko,
  });

  return (
    <>
      {/* 네이버 지도 API 스크립트 로더 - 프로젝트 페이지에서만 로드 */}
      <NaverMapScript />

      <div className="w-full min-h-screen bg-slate-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleGoBack} aria-label="뒤로 가기">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-slate-900 flex-1 truncate">
              {project.title}
            </h1>
            {project.role === "creator" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                aria-label="프로젝트 삭제"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Phase 3: 네이버 지도 섹션 */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div ref={searchAreaRef} className="p-6 space-y-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">장소 검색 및 후보지 등록</h2>
              <LocationSearch
                onSearchResults={handleSearchResults}
                onSelectLocation={handleSelectLocationFromSearch}
                onCloseResults={handleCloseSearchResults}
                showResults={showSearchResults}
                userRole={project.role}
              />
            </div>

            {/* Phase 5: RealtimeProvider로 후보지 데이터 동기화 */}
            <RealtimeProvider projectId={projectId}>
              {/* 지도 및 정보 패널 */}
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-0">
                {/* 좌측: 지도 영역 (lg: 60%) */}
                <div ref={mapAreaRef} className="flex-1 lg:border-r lg:border-slate-200">
                  <div className="h-[400px] lg:h-[600px] w-full">
                    <NaverMap
                      searchResults={searchResults}
                      selectedLocation={selectedLocation}
                      onLocationSelect={handleLocationSelect}
                      onAddLocation={handleAddLocationClick}
                      userRole={project.role}
                      focusCoordinates={focusCoordinates}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* 우측: 탭 시스템 패널 (lg: 40%) */}
                <div className="flex-1 flex flex-col bg-slate-50 lg:bg-white lg:border-l lg:border-slate-200 h-[400px] lg:h-[600px]">
                  {/* 탭 헤더 */}
                  <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
                    {["info", "members", "candidates"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as typeof activeTab)}
                        className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
                          activeTab === tab
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-slate-600 hover:text-slate-900 border-b-2 border-transparent"
                        }`}
                      >
                        {tab === "info" ? "정보" : tab === "members" ? "멤버" : "후보지"}
                      </button>
                    ))}
                  </div>

                  {/* 탭 콘텐츠 */}
                  <div className="flex-1 p-6 overflow-y-auto min-h-0">
                    {/* 정보 탭 */}
                    {activeTab === "info" && (
                      <div className="space-y-6">
                        {/* 프로젝트 정보 카드 */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-slate-900">프로젝트 정보</h3>

                          <div>
                            <label className="text-xs font-medium text-slate-600">날짜</label>
                            <p className="text-sm text-slate-900">{formattedDate}</p>
                          </div>

                          <div className="border-t border-slate-200 pt-3">
                            <label className="text-xs font-medium text-slate-600">상태</label>
                            <div className="flex gap-2 items-center mt-2">
                              <span
                                className={`
                                px-3 py-1 rounded-full text-xs font-medium
                                ${
                                  project.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : project.status === "archived"
                                      ? "bg-gray-100 text-gray-700"
                                      : "bg-blue-100 text-blue-700"
                                }
                              `}
                              >
                                {project.status === "active"
                                  ? "진행 중"
                                  : project.status === "archived"
                                    ? "보관됨"
                                    : "완료"}
                              </span>
                            </div>
                          </div>

                          {project.created_at && (
                            <div className="border-t border-slate-200 pt-3">
                              <label className="text-xs font-medium text-slate-600">생성일</label>
                              <p className="text-xs text-slate-600 mt-1">
                                {format(new Date(project.created_at), "yyyy년 M월 d일 HH:mm", {
                                  locale: ko,
                                })}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 공유 링크 섹션 */}
                        {project.share_link && (
                          <div className="border-t border-slate-200 pt-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">공유 링크</h3>
                            <ShareLinkButton
                              projectId={project.id}
                              shareLink={project.share_link}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 멤버 탭 */}
                    {activeTab === "members" && (
                      <div>
                        <MemberList members={project.members} />
                      </div>
                    )}

                    {/* 후보지 탭 */}
                    {activeTab === "candidates" && (
                      <div>
                        <CandidateList
                          projectId={projectId}
                          totalMembers={project.members.length}
                          onCardClick={handleCandidateClick}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Phase 5: 후보지 등록 모달을 RealtimeProvider 내부로 이동 */}
              <AddLocationModalWrapper
                isOpen={isAddModalOpen}
                location={locationToAdd}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddLocationSubmit}
              />
            </RealtimeProvider>
          </div>
        </div>

        {/* 삭제 확인 다이얼로그 */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>프로젝트 삭제</DialogTitle>
              <DialogDescription>
                &quot;{project?.title}&quot; 프로젝트를 삭제하시겠습니까?
                <br />이 작업은 되돌릴 수 없습니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
              >
                취소
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  "삭제"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

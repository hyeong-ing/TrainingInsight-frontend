import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchDashboard } from '../api/dashboardApi.js';
import { fetchEmployeeTrainingStatuses, updateTrainingCompletion } from '../api/employeeTrainingApi.js';
import { fetchIncompleteTrainings } from '../api/trainingApi.js';
import CourseIncompleteDetail from '../components/CourseIncompleteDetail.jsx';
import EmployeeTrainingPanel from '../components/EmployeeTrainingPanel.jsx';
import EmptyView from '../components/EmptyView.jsx';
import ErrorView from '../components/ErrorView.jsx';
import LoadingView from '../components/LoadingView.jsx';
import { queryKeys } from '../queryClient.js';

const COURSE_PAGE_SIZE = 5;
const EMPLOYEE_PAGE_SIZE = 5;

function safeNumber(value) {
  return value ?? 0;
}

function clampPercentage(value) {
  return Math.min(100, Math.max(0, safeNumber(value)));
}

function displayTarget(value) {
  return value === 'ALL' ? '전체' : value;
}

function displayRequired(required) {
  return required ? '필수' : '선택';
}

export default function IncompletePage() {
  const courseDrawerTriggerRef = useRef(null);
  const savingKeysRef = useRef(new Set());
  const tabsListRef = useRef(null);
  const tabTriggerRefs = useRef({});
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get('view');
  const activeView = requestedView === 'employee' ? 'employee' : 'course';
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseTitleQuery, setCourseTitleQuery] = useState('');
  const [coursePage, setCoursePage] = useState(1);
  const [employeePage, setEmployeePage] = useState(1);
  const [employeePanelPage, setEmployeePanelPage] = useState(1);
  const [isCourseDrawerOpen, setIsCourseDrawerOpen] = useState(false);
  const [savingKeys, setSavingKeys] = useState(() => new Set());
  const [updateError, setUpdateError] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0, ready: false });

  const incompleteQuery = useQuery({
    queryKey: queryKeys.incompleteTrainings,
    queryFn: fetchIncompleteTrainings,
  });
  const employeeTrainingQuery = useQuery({
    queryKey: queryKeys.employeeTrainingStatuses,
    queryFn: fetchEmployeeTrainingStatuses,
  });
  const completionMutation = useMutation({ mutationFn: updateTrainingCompletion });
  const results = Array.isArray(incompleteQuery.data?.results) ? incompleteQuery.data.results : [];
  const employeeTrainingStatuses = Array.isArray(employeeTrainingQuery.data?.results)
    ? employeeTrainingQuery.data.results
    : [];
  const isRefreshing = incompleteQuery.isFetching && !incompleteQuery.isPending;

  useLayoutEffect(() => {
    function updateTabIndicator() {
      const activeTrigger = tabTriggerRefs.current[activeView];
      const tabsList = tabsListRef.current;
      if (!activeTrigger || !tabsList) {
        return;
      }

      const activeTriggerRect = activeTrigger.getBoundingClientRect();
      const tabsListRect = tabsList.getBoundingClientRect();
      const nextIndicator = {
        left: activeTriggerRect.left - tabsListRect.left + tabsList.scrollLeft,
        width: activeTriggerRect.width,
        ready: true,
      };
      setTabIndicator((currentIndicator) => (
        currentIndicator.ready &&
        currentIndicator.left === nextIndicator.left &&
        currentIndicator.width === nextIndicator.width
          ? currentIndicator
          : nextIndicator
      ));
    }

    updateTabIndicator();
    window.addEventListener('resize', updateTabIndicator);
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateTabIndicator);
    if (tabsListRef.current) {
      resizeObserver?.observe(tabsListRef.current);
    }
    Object.values(tabTriggerRefs.current).forEach((trigger) => {
      if (trigger) {
        resizeObserver?.observe(trigger);
      }
    });

    return () => {
      window.removeEventListener('resize', updateTabIndicator);
      resizeObserver?.disconnect();
    };
  }, [activeView]);

  const filteredResults = useMemo(() => {
    const normalizedTitleQuery = courseTitleQuery.trim().toLowerCase();

    return results.filter((course) => (
      normalizedTitleQuery === '' || course.courseTitle?.toLowerCase().includes(normalizedTitleQuery)
    ));
  }, [courseTitleQuery, results]);

  useEffect(() => {
    setCoursePage(1);
  }, [courseTitleQuery]);

  useEffect(() => {
    if (filteredResults.length === 0) {
      setSelectedCourseId(null);
      setIsCourseDrawerOpen(false);
      return;
    }
    if (selectedCourseId !== null) {
      const selectedCourseExists = filteredResults.some((course) => course.courseId === selectedCourseId);
      if (!selectedCourseExists) {
        setSelectedCourseId(null);
        setIsCourseDrawerOpen(false);
      }
    }
  }, [filteredResults, selectedCourseId]);

  useEffect(() => {
    if (activeView !== 'course') {
      setIsCourseDrawerOpen(false);
    }
  }, [activeView]);

  useEffect(() => {
    setEmployeePage(1);
  }, [selectedCourseId]);

  const courseTotalPages = Math.max(1, Math.ceil(filteredResults.length / COURSE_PAGE_SIZE));
  const currentCoursePage = Math.min(coursePage, courseTotalPages);
  const courseStartIndex = (currentCoursePage - 1) * COURSE_PAGE_SIZE;
  const pagedCourses = filteredResults.slice(courseStartIndex, courseStartIndex + COURSE_PAGE_SIZE);
  const courseEndIndex = courseStartIndex + pagedCourses.length;
  const courseRangeStart = pagedCourses.length > 0 ? courseStartIndex + 1 : 0;

  const selectedCourse = filteredResults.find((course) => course.courseId === selectedCourseId) ?? null;
  const selectedEmployees = Array.isArray(selectedCourse?.employees) ? selectedCourse.employees : [];
  const employeeTotalPages = Math.max(1, Math.ceil(selectedEmployees.length / EMPLOYEE_PAGE_SIZE));
  const currentEmployeePage = Math.min(employeePage, employeeTotalPages);
  const employeeStartIndex = (currentEmployeePage - 1) * EMPLOYEE_PAGE_SIZE;
  const pagedEmployees = selectedEmployees.slice(employeeStartIndex, employeeStartIndex + EMPLOYEE_PAGE_SIZE);
  const employeeEndIndex = employeeStartIndex + pagedEmployees.length;

  function handleViewChange(nextView) {
    if (nextView !== 'course') {
      setIsCourseDrawerOpen(false);
    }
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('view', nextView);
    setSearchParams(nextSearchParams);
  }

  function resetFilters() {
    setCourseTitleQuery('');
    setCoursePage(1);
  }

  async function refreshPageData() {
    setUpdateError('');
    await Promise.all([incompleteQuery.refetch(), employeeTrainingQuery.refetch()]);
  }

  function retryIncompleteTrainings() {
    setUpdateError('');
    return incompleteQuery.refetch();
  }

  function retryEmployeeTrainingStatuses() {
    setUpdateError('');
    return employeeTrainingQuery.refetch();
  }

  function handleCourseDrawerCloseAutoFocus(event) {
    event.preventDefault();
    courseDrawerTriggerRef.current?.focus();
  }

  async function handleCompletionChange({ employeeId, courseId, completed }) {
    const checkboxKey = `${employeeId}-${courseId}`;

    if (savingKeysRef.current.has(checkboxKey)) {
      return;
    }

    savingKeysRef.current.add(checkboxKey);
    setSavingKeys(new Set(savingKeysRef.current));
    setUpdateError('');
    setUpdateMessage('');
    let completionSaved = false;

    try {
      await completionMutation.mutateAsync({ employeeId, courseId, completed });
      completionSaved = true;

      await Promise.all([
        queryClient.invalidateQueries(
          { queryKey: queryKeys.employeeTrainingStatuses, refetchType: 'all' },
          { throwOnError: true },
        ),
        queryClient.invalidateQueries(
          { queryKey: queryKeys.incompleteTrainings, refetchType: 'all' },
          { throwOnError: true },
        ),
        queryClient.invalidateQueries(
          { queryKey: queryKeys.dashboard, refetchType: 'all' },
          { throwOnError: true },
        ),
      ]);

      setUpdateMessage('수료 상태를 변경했어요. 관련 교육과 대시보드 현황도 갱신했습니다.');
      toast.success('수료 상태를 변경했어요.');
    } catch (requestError) {
      const message = completionSaved
        ? '수료 상태는 저장됐지만 최신 현황을 불러오지 못했습니다. 다시 새로고침해주세요.'
        : '수료 상태를 변경하지 못했어요. 다시 시도해주세요.';
      setUpdateError(message);
      toast.error(message);
    } finally {
      savingKeysRef.current.delete(checkboxKey);
      setSavingKeys(new Set(savingKeysRef.current));
    }
  }

  function renderCourseContent() {
    if (incompleteQuery.isPending) {
      return (
        <div role="status">
          <LoadingView message="교육별 미수료 현황을 불러오는 중…" />
        </div>
      );
    }

    if (incompleteQuery.isError && results.length === 0) {
      return (
        <div role="alert">
          <ErrorView
            title="교육별 미수료 현황을 불러오지 못했습니다."
            message="일시적인 문제일 수 있습니다. 잠시 후 다시 시도해주세요."
            onRetry={retryIncompleteTrainings}
            isRetrying={incompleteQuery.isFetching}
          />
        </div>
      );
    }

    return (
      <>
        <section className="toolbar-panel incomplete-toolbar" aria-label="교육별 미수료 필터">
          <div className="field incomplete-search-field">
            <div className="search-input-wrap">
              <svg className="search-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                type="search"
                name="courseTitle"
                autoComplete="off"
                aria-label="교육명 검색"
                value={courseTitleQuery}
                onChange={(event) => setCourseTitleQuery(event.target.value)}
                placeholder="교육명을 입력하세요"
              />
            </div>
          </div>
          <button
            className="action-button action-button--secondary"
            type="button"
            disabled={courseTitleQuery.length === 0}
            onClick={resetFilters}
          >
            검색 초기화
          </button>
          <button
            className="action-button"
            type="button"
            disabled={isRefreshing}
            onClick={refreshPageData}
          >
            {isRefreshing ? '새로고침 중…' : '미수료자 새로고침'}
          </button>
        </section>

        {incompleteQuery.isError ? (
          <div role="alert">
            <ErrorView
              title="교육 현황을 최신 상태로 갱신하지 못했습니다."
              message="현재 목록과 검색어는 그대로 유지했습니다."
              onRetry={retryIncompleteTrainings}
              isRetrying={incompleteQuery.isFetching}
            />
          </div>
        ) : null}

        <section className="dashboard-panel course-status-panel" aria-labelledby="course-status-heading">
          <div className="course-status-heading">
            <div className="section-heading">
              <h2 id="course-status-heading">교육별 미수료 현황</h2>
              <p>교육별 대상 조건, 미수료 건수, 수료율을 확인합니다.</p>
            </div>
            <div className="list-summary" aria-live="polite">
              전체 {filteredResults.length}개 · {courseRangeStart}–{courseEndIndex}개 표시
            </div>
          </div>

          {results.length === 0 ? (
            <EmptyView message="등록된 교육 미수료 현황이 없습니다." />
          ) : filteredResults.length === 0 ? (
            <EmptyView message="검색어에 맞는 교육이 없습니다." />
          ) : (
            <>
              <div className="table-wrap course-status-table-wrap" role="region" aria-label="교육별 미수료 표" tabIndex="0">
                <table className="data-table course-status-table">
                  <caption className="visually-hidden">교육별 대상 조건, 미수료 건수와 수료율</caption>
                  <thead>
                    <tr>
                      <th scope="col">교육명</th>
                      <th scope="col">카테고리</th>
                      <th scope="col">필수·선택</th>
                      <th scope="col">대상 조건</th>
                      <th scope="col">미수료</th>
                      <th scope="col">수료율</th>
                      <th scope="col">상세</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedCourses.map((course) => {
                      const completionRate = safeNumber(course.completionRate);
                      const progressValue = clampPercentage(completionRate);

                      return (
                        <tr
                          className={isCourseDrawerOpen && selectedCourseId === course.courseId ? 'is-drawer-selected' : undefined}
                          key={course.courseId}
                        >
                          <th className="course-status-table__title" scope="row">{course.courseTitle}</th>
                          <td>{course.category ?? '없음'}</td>
                          <td>
                            <span className={course.required ? 'status-badge' : 'status-badge status-badge--muted'}>
                              {displayRequired(course.required)}
                            </span>
                          </td>
                          <td>{displayTarget(course.targetDepartment)} · {displayTarget(course.targetHireType)}</td>
                          <td><span className="incomplete-count">{safeNumber(course.incompleteCount)}건</span></td>
                          <td>
                            <div className="course-completion">
                              <div
                                className="completion-meter__track"
                                role="progressbar"
                                aria-label={`${course.courseTitle} 수료율`}
                                aria-valuenow={progressValue}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              >
                                <div className="completion-meter__bar" style={{ width: `${progressValue}%` }} />
                              </div>
                              <strong>{completionRate}%</strong>
                            </div>
                          </td>
                          <td>
                            <button
                              className="text-button"
                              type="button"
                              aria-haspopup="dialog"
                              aria-label={`상세 보기: ${course.courseTitle}`}
                              aria-pressed={isCourseDrawerOpen && selectedCourseId === course.courseId}
                              onClick={(event) => {
                                courseDrawerTriggerRef.current = event.currentTarget;
                                setSelectedCourseId(course.courseId);
                                setIsCourseDrawerOpen(true);
                              }}
                            >
                              상세 보기
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="pagination" aria-label="교육 목록 페이지">
                <button
                  className="action-button action-button--secondary"
                  type="button"
                  disabled={currentCoursePage === 1}
                  onClick={() => setCoursePage((page) => Math.max(1, page - 1))}
                >
                  이전
                </button>
                <span aria-live="polite">{currentCoursePage} / {courseTotalPages}</span>
                <button
                  className="action-button action-button--secondary"
                  type="button"
                  disabled={currentCoursePage === courseTotalPages}
                  onClick={() => setCoursePage((page) => Math.min(courseTotalPages, page + 1))}
                >
                  다음
                </button>
              </div>
            </>
          )}
        </section>

      </>
    );
  }

  function renderEmployeeContent() {
    if (employeeTrainingQuery.isPending) {
      return (
        <div role="status">
          <LoadingView message="직원별 이수 상태를 불러오는 중…" />
        </div>
      );
    }

    if (employeeTrainingQuery.isError && employeeTrainingStatuses.length === 0) {
      return (
        <div role="alert">
          <ErrorView
            title="직원별 이수 상태를 불러오지 못했습니다."
            message="일시적인 문제일 수 있습니다. 잠시 후 다시 시도해주세요."
            onRetry={retryEmployeeTrainingStatuses}
            isRetrying={employeeTrainingQuery.isFetching}
          />
        </div>
      );
    }

    return (
      <>
        {employeeTrainingQuery.isError ? (
          <div role="alert">
            <ErrorView
              title="직원 교육 상태를 최신 상태로 갱신하지 못했습니다."
              message="현재 목록은 그대로 유지했습니다."
              onRetry={retryEmployeeTrainingStatuses}
              isRetrying={employeeTrainingQuery.isFetching}
            />
          </div>
        ) : null}
        {updateError ? (
          <div role="alert">
            <ErrorView message={updateError} />
          </div>
        ) : null}
        <div className="visually-hidden" role="status" aria-live="polite">
          {updateMessage}
        </div>
        <EmployeeTrainingPanel
          employees={employeeTrainingStatuses}
          page={employeePanelPage}
          onPageChange={setEmployeePanelPage}
          onCompletionChange={handleCompletionChange}
          savingKeys={savingKeys}
          isRefreshing={employeeTrainingQuery.isFetching && !employeeTrainingQuery.isPending}
        />
      </>
    );
  }

  return (
    <Dialog.Root open={isCourseDrawerOpen} onOpenChange={setIsCourseDrawerOpen}>
      <section className="page-section incomplete-page">
        <div className="page-heading">
          <h1>교육 현황</h1>
          <p>교육별 미수료 현황과 직원별 교육 이수 상태를 한 곳에서 확인합니다.</p>
        </div>

        <Tabs.Root
          className="incomplete-tabs"
          value={activeView}
          orientation="horizontal"
          activationMode="manual"
          onValueChange={handleViewChange}
        >
          <Tabs.List className="incomplete-tabs__list" aria-label="교육 현황 보기" ref={tabsListRef}>
            <span
              className={`incomplete-tabs__indicator${tabIndicator.ready ? ' is-ready' : ''}`}
              style={{ transform: `translateX(${tabIndicator.left}px)`, width: `${tabIndicator.width}px` }}
              aria-hidden="true"
            />
            <Tabs.Trigger
              className="incomplete-tabs__trigger"
              value="course"
              ref={(element) => {
                tabTriggerRefs.current.course = element;
              }}
            >
              교육별 미수료
            </Tabs.Trigger>
            <Tabs.Trigger
              className="incomplete-tabs__trigger"
              value="employee"
              ref={(element) => {
                tabTriggerRefs.current.employee = element;
              }}
            >
              직원별 이수 상태
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content className="incomplete-tabs__content" value="course">
            {renderCourseContent()}
          </Tabs.Content>
          <Tabs.Content className="incomplete-tabs__content" value="employee">
            {renderEmployeeContent()}
          </Tabs.Content>
        </Tabs.Root>
      </section>
      <CourseIncompleteDetail
        course={selectedCourse}
        employees={pagedEmployees}
        startIndex={employeeStartIndex}
        endIndex={employeeEndIndex}
        currentPage={currentEmployeePage}
        totalPages={employeeTotalPages}
        isLoading={isRefreshing}
        error={incompleteQuery.error}
        onRetry={retryIncompleteTrainings}
        onCloseAutoFocus={handleCourseDrawerCloseAutoFocus}
        onPageChange={setEmployeePage}
      />
    </Dialog.Root>
  );
}

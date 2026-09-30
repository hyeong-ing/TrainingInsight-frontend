import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '../api/dashboardApi.js';
import StatCard from '../components/StatCard.jsx';
import { queryKeys } from '../queryClient.js';

const initialDashboard = {
  employeeCount: 0,
  courseCount: 0,
  requiredCourseCount: 0,
  overallCompletionRate: 0,
  totalIncompleteEmployeeCount: 0,
  requiredCourseStats: [],
};

function safeNumber(value) {
  return value ?? 0;
}

function clampPercentage(value) {
  return Math.min(100, Math.max(0, safeNumber(value)));
}

function DashboardHeading() {
  return (
    <div className="page-heading">
      <h1>교육 운영 대시보드</h1>
      <p>교육 운영 규모와 필수교육 수료 현황을 빠르게 확인합니다.</p>
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <section className="page-section dashboard-page" aria-busy="true">
      <DashboardHeading />
      <div className="dashboard-loading" role="status" aria-label="대시보드 데이터를 불러오는 중입니다.">
        <span className="visually-hidden">대시보드 데이터를 불러오는 중입니다.</span>
        <div className="stat-grid stat-grid--dashboard" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <div className="stat-card dashboard-skeleton-card" key={index}>
              <span className="dashboard-skeleton-line dashboard-skeleton-line--label" />
              <span className="dashboard-skeleton-line dashboard-skeleton-line--value" />
            </div>
          ))}
        </div>
        <div className="dashboard-panel dashboard-skeleton-panel" aria-hidden="true">
          <span className="dashboard-skeleton-line dashboard-skeleton-line--title" />
          <span className="dashboard-skeleton-line" />
          <span className="dashboard-skeleton-line" />
          <span className="dashboard-skeleton-line" />
        </div>
      </div>
    </section>
  );
}

function DashboardErrorState({ isRetrying, onRetry }) {
  return (
    <section className="page-section dashboard-page">
      <DashboardHeading />
      <section className="dashboard-panel dashboard-error-panel" role="alert" aria-live="assertive">
        <div>
          <h2>대시보드 정보를 불러오지 못했습니다.</h2>
          <p>일시적인 문제일 수 있습니다. 잠시 후 다시 시도해주세요.</p>
        </div>
        <button className="action-button" type="button" disabled={isRetrying} onClick={onRetry}>
          {isRetrying ? '다시 불러오는 중…' : '다시 시도'}
        </button>
      </section>
    </section>
  );
}

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboard,
  });

  if (dashboardQuery.isPending) {
    return <DashboardLoadingState />;
  }

  if (dashboardQuery.isError) {
    return (
      <DashboardErrorState
        isRetrying={dashboardQuery.isFetching}
        onRetry={() => dashboardQuery.refetch()}
      />
    );
  }

  const dashboardData = dashboardQuery.data;
  const dashboard = {
    ...initialDashboard,
    ...dashboardData,
    requiredCourseStats: Array.isArray(dashboardData?.requiredCourseStats)
      ? dashboardData.requiredCourseStats
      : [],
  };
  const requiredCourseStats = dashboard.requiredCourseStats;

  return (
    <section className="page-section dashboard-page">
      <DashboardHeading />

      <div className="stat-grid stat-grid--dashboard" aria-label="교육 운영 주요 지표">
        <StatCard
          label="필수교육 미수료 건수"
          value={`${safeNumber(dashboard.totalIncompleteEmployeeCount)}건`}
          helper="교육-직원 미수료 조합"
          tone="attention"
        />
        <StatCard label="전체 직원" value={`${safeNumber(dashboard.employeeCount)}명`} helper="재직 직원 기준" />
        <StatCard label="전체 교육" value={`${safeNumber(dashboard.courseCount)}개`} helper="운영 중인 교육 과정" />
        <StatCard label="필수 교육" value={`${safeNumber(dashboard.requiredCourseCount)}개`} helper="필수 지정 과정" />
        <StatCard
          label="전체 수료율"
          value={`${safeNumber(dashboard.overallCompletionRate)}%`}
          helper="전체 대상 교육 기준"
        />
      </div>

      <section className="dashboard-panel dashboard-required-panel" aria-labelledby="required-course-heading">
        <div className="section-heading">
          <h2 id="required-course-heading">필수교육별 현황</h2>
          <p>교육별 미수료 건수와 수료율을 비교합니다.</p>
        </div>

        {requiredCourseStats.length === 0 ? (
          <div className="dashboard-empty-state" role="status">
            <strong>표시할 필수교육 현황이 없습니다.</strong>
            <p>필수교육 데이터가 등록되면 교육별 수료 현황이 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div
            className="table-wrap dashboard-status-table-wrap"
            role="region"
            aria-label="필수교육 현황 표"
            tabIndex="0"
          >
            <table className="data-table dashboard-status-table">
              <caption className="visually-hidden">필수교육별 미수료 건수와 수료율</caption>
              <thead>
                <tr>
                  <th scope="col">교육명</th>
                  <th scope="col">미수료</th>
                  <th scope="col">수료율</th>
                </tr>
              </thead>
              <tbody>
                {requiredCourseStats.map((course) => {
                  const completionRate = safeNumber(course.completionRate);
                  const progressValue = clampPercentage(completionRate);

                  return (
                    <tr key={course.courseId}>
                      <th className="dashboard-course-title" scope="row">
                        {course.courseTitle}
                      </th>
                      <td>
                        <span className="dashboard-incomplete-value">
                          미수료 {safeNumber(course.incompleteCount)}건
                        </span>
                      </td>
                      <td>
                        <div className="completion-meter completion-meter--table">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

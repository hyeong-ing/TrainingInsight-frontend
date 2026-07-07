import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard } from '../api/dashboardApi.js';
import EmptyView from '../components/EmptyView.jsx';
import ErrorView from '../components/ErrorView.jsx';
import LoadingView from '../components/LoadingView.jsx';
import StatCard from '../components/StatCard.jsx';

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

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchDashboard();

        if (!ignore) {
          setDashboard({
            ...initialDashboard,
            ...data,
            requiredCourseStats: Array.isArray(data?.requiredCourseStats) ? data.requiredCourseStats : [],
          });
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  if (isLoading) {
    return <LoadingView message="대시보드 데이터를 불러오는 중입니다." />;
  }

  if (error) {
    return <ErrorView message="대시보드 데이터를 불러오지 못했습니다. 백엔드 서버 상태를 확인해주세요." />;
  }

  const requiredCourseStats = dashboard.requiredCourseStats;



  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="page-kicker">Dashboard</p>
        <h1>TrainingInsight Dashboard</h1>
        <p>HRD 교육 데이터를 기반으로 수료 현황과 미수료 현황을 확인합니다.</p>
      </div>

      <div className="dashboard-actions" aria-label="빠른 이동">
        <Link className="action-button" to="/incomplete">
          미수료자 자동 추출
        </Link>
        <Link className="action-button action-button--secondary" to="/ai-search">
          AI 교육 검색
        </Link>
      </div>

      <div className="stat-grid stat-grid--dashboard">
        <StatCard label="전체 직원 수" value={`${safeNumber(dashboard.employeeCount)}명`} />
        <StatCard label="전체 교육 과정 수" value={`${safeNumber(dashboard.courseCount)}개`} />
        <StatCard label="필수교육 수" value={`${safeNumber(dashboard.requiredCourseCount)}개`} />
        <StatCard label="전체 수료율" value={`${safeNumber(dashboard.overallCompletionRate)}%`} />
        <StatCard label="필수교육 미수료자 수" value={`${safeNumber(dashboard.totalIncompleteEmployeeCount)}명`} />
      </div>

      <section className="dashboard-panel">
        <div className="section-heading">
          <h2>필수교육별 미수료 현황</h2>
          <p>교육별 미수료자 수와 수료율을 확인합니다.</p>
        </div>

        {requiredCourseStats.length === 0 ? (
          <EmptyView message="표시할 필수교육 통계가 없습니다." />
        ) : (
          <div className="course-stat-list">
            {requiredCourseStats.map((course) => (
              <article className="course-stat-item" key={course.courseId}>
                <div>
                  <h3>{course.courseTitle}</h3>
                  <p>미수료자 {safeNumber(course.incompleteCount)}명</p>
                </div>
                <div className="completion-meter" aria-label={`${course.courseTitle} 수료율`}>
                  <span>{safeNumber(course.completionRate)}%</span>
                  <div className="completion-meter__track">
                    <div
                      className="completion-meter__bar"
                      style={{ width: `${Math.min(100, Math.max(0, safeNumber(course.completionRate)))}%` }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

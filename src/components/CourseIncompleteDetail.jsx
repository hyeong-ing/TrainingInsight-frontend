import * as Dialog from '@radix-ui/react-dialog';
import EmptyView from './EmptyView.jsx';
import ErrorView from './ErrorView.jsx';

function safeNumber(value) {
  return value ?? 0;
}

function clampPercentage(value) {
  return Math.min(100, Math.max(0, safeNumber(value)));
}

function displayTarget(value) {
  return value === 'ALL' ? '전체' : value;
}

export default function CourseIncompleteDetail({
  course,
  employees,
  startIndex,
  endIndex,
  currentPage,
  totalPages,
  isLoading,
  error,
  onRetry,
  onCloseAutoFocus,
  onPageChange,
}) {
  if (!course) {
    return null;
  }

  const completionRate = safeNumber(course.completionRate);
  const progressValue = clampPercentage(completionRate);
  const incompleteEmployees = Array.isArray(course.employees) ? course.employees : [];

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="course-drawer__overlay" />
      <Dialog.Content
        className="course-drawer"
        aria-describedby="course-drawer-description"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <header className="course-drawer__header">
          <div>
            <Dialog.Title className="course-drawer__title">{course.courseTitle}</Dialog.Title>
            <Dialog.Description className="course-drawer__description" id="course-drawer-description">
              교육 대상 조건과 미수료 직원 현황입니다.
            </Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button className="course-drawer__close" type="button" aria-label="교육 상세 닫기">
              닫기
            </button>
          </Dialog.Close>
        </header>

        <div className="course-drawer__body">
          <section className="course-drawer__summary" aria-labelledby="course-summary-heading">
            <h2 className="course-drawer__section-title" id="course-summary-heading">교육 정보</h2>
            <dl className="course-drawer__metadata">
              <div>
                <dt>카테고리</dt>
                <dd>{course.category ?? '없음'}</dd>
              </div>
              <div>
                <dt>구분</dt>
                <dd>{course.required ? '필수' : '선택'}</dd>
              </div>
              <div>
                <dt>대상 조건</dt>
                <dd>{displayTarget(course.targetDepartment)} · {displayTarget(course.targetHireType)}</dd>
              </div>
              <div>
                <dt>대상 인원</dt>
                <dd>{safeNumber(course.targetEmployeeCount)}명</dd>
              </div>
              <div>
                <dt>미수료</dt>
                <dd className="course-drawer__attention">{safeNumber(course.incompleteCount)}건</dd>
              </div>
            </dl>

            <div className="course-drawer__completion">
              <div className="course-drawer__completion-heading">
                <span>수료율</span>
                <strong>{completionRate}%</strong>
              </div>
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
            </div>
          </section>

          <section className="course-drawer__employees" aria-labelledby="course-employees-heading">
            <div className="course-drawer__employees-heading">
              <div>
                <h2 className="course-drawer__section-title" id="course-employees-heading">미수료 직원</h2>
                <p>기존 교육 대상 순서로 표시합니다.</p>
              </div>
              <span className="list-summary">
                전체 {incompleteEmployees.length}명 · {employees.length > 0 ? startIndex + 1 : 0}–{endIndex}명
              </span>
            </div>

            {isLoading ? (
              <div className="course-drawer__state" role="status">미수료 직원 목록을 갱신하는 중…</div>
            ) : error ? (
              <ErrorView
                title="교육 상세 정보를 최신 상태로 갱신하지 못했습니다."
                message="현재 선택과 페이지는 그대로 유지했습니다."
                onRetry={onRetry}
                isRetrying={isLoading}
              />
            ) : employees.length === 0 ? (
              <EmptyView message="이 교육의 미수료자가 없습니다." />
            ) : (
              <div className="course-drawer__employee-list">
                {employees.map((employee) => (
                  <article className="course-drawer__employee" key={employee.employeeId}>
                    <strong>{employee.name}</strong>
                    <span>{employee.department}</span>
                    <span>{employee.position} · {employee.hireType}</span>
                  </article>
                ))}
              </div>
            )}

            <div className="pagination course-drawer__pagination" aria-label="미수료 직원 페이지">
              <button
                className="action-button action-button--secondary"
                type="button"
                disabled={isLoading || currentPage === 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              >
                이전
              </button>
              <span aria-live="polite">{currentPage} / {totalPages}</span>
              <button
                className="action-button action-button--secondary"
                type="button"
                disabled={isLoading || currentPage === totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              >
                다음
              </button>
            </div>
          </section>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

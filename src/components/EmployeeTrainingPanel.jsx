import EmptyView from './EmptyView.jsx';

const EMPLOYEE_PANEL_PAGE_SIZE = 5;

function displayRequired(required) {
  return required ? '필수' : '선택';
}

export default function EmployeeTrainingPanel({
  employees,
  page,
  onPageChange,
  onCompletionChange,
  updatingKey,
}) {
  const totalPages = Math.max(1, Math.ceil(employees.length / EMPLOYEE_PANEL_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * EMPLOYEE_PANEL_PAGE_SIZE;
  const pagedEmployees = employees.slice(startIndex, startIndex + EMPLOYEE_PANEL_PAGE_SIZE);
  const endIndex = startIndex + pagedEmployees.length;

  return (
    <section className="dashboard-panel">
      <div className="section-heading">
        <h2>직원별 교육 이수 상태</h2>
        <p>직원의 부서와 입사 유형에 따라 들어야 하는 교육을 자동으로 연결하고, 체크 여부로 수료 상태를 확인합니다.</p>
      </div>

      {employees.length === 0 ? (
        <EmptyView message="표시할 직원 교육 상태가 없습니다." />
      ) : (
        <>
          <div className="list-summary">
            직원 {employees.length}명 중 {startIndex + 1}-{endIndex}명 표시
          </div>
          <div className="employee-training-list">
            {pagedEmployees.map((employee) => (
              <article className="employee-training-card" key={employee.employeeId}>
                <div className="employee-training-card__header">
                  <strong>{employee.name}</strong>
                  <span>{employee.department}</span>
                  <span>{employee.position}</span>
                  <span>{employee.hireType}</span>
                </div>
                <div className="target-course-checklist">
                  {employee.targetCourses.map((course) => {
                    const checkboxKey = `${employee.employeeId}-${course.courseId}`;
                    const isUpdating = updatingKey === checkboxKey;

                    return (
                      <label className="course-check-item" key={course.courseId}>
                        <input
                          type="checkbox"
                          checked={course.completed}
                          disabled={isUpdating}
                          onChange={(event) =>
                            onCompletionChange({
                              employeeId: employee.employeeId,
                              courseId: course.courseId,
                              completed: event.target.checked,
                            })
                          }
                        />
                        <span>{course.title}</span>
                        <em className={course.required ? 'status-badge' : 'status-badge status-badge--muted'}>
                          {displayRequired(course.required)}
                        </em>
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
          <div className="pagination">
            <button
              className="action-button action-button--secondary"
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            >
              이전
            </button>
            <span>{currentPage} / {totalPages}</span>
            <button
              className="action-button action-button--secondary"
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            >
              다음
            </button>
          </div>
        </>
      )}
    </section>
  );
}

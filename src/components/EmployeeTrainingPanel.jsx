import * as Accordion from '@radix-ui/react-accordion';
import { useEffect, useState } from 'react';
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
  savingKeys,
  isRefreshing,
}) {
  const [expandedEmployeeId, setExpandedEmployeeId] = useState('');
  const totalPages = Math.max(1, Math.ceil(employees.length / EMPLOYEE_PANEL_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * EMPLOYEE_PANEL_PAGE_SIZE;
  const pagedEmployees = employees.slice(startIndex, startIndex + EMPLOYEE_PANEL_PAGE_SIZE);
  const endIndex = startIndex + pagedEmployees.length;

  useEffect(() => {
    setExpandedEmployeeId('');
  }, [currentPage]);

  function changePage(nextPage) {
    setExpandedEmployeeId('');
    onPageChange(nextPage);
  }

  return (
    <section className="dashboard-panel employee-training-panel" aria-labelledby="employee-training-heading">
      <div className="employee-training-panel__heading">
        <div className="section-heading">
          <h2 id="employee-training-heading">직원별 교육 이수 상태</h2>
          <p>직원의 부서와 입사 유형에 따라 연결된 대상 교육과 수료 상태를 확인합니다.</p>
        </div>
        {employees.length > 0 ? (
          <div className="list-summary" aria-live="polite">
            전체 {employees.length}명 · {startIndex + 1}–{endIndex}명 표시
          </div>
        ) : null}
      </div>

      {employees.length === 0 ? (
        <EmptyView message="표시할 직원 교육 상태가 없습니다." />
      ) : (
        <>
          <Accordion.Root
            className="employee-accordion"
            type="single"
            collapsible
            value={expandedEmployeeId}
            onValueChange={setExpandedEmployeeId}
          >
            {pagedEmployees.map((employee) => {
              const targetCourses = Array.isArray(employee.targetCourses) ? employee.targetCourses : [];
              const completedCount = targetCourses.filter((course) => course.completed).length;
              const employeeValue = String(employee.employeeId);

              return (
                <Accordion.Item className="employee-accordion__item" key={employee.employeeId} value={employeeValue}>
                  <Accordion.Header className="employee-accordion__header">
                    <Accordion.Trigger
                      className="employee-accordion__trigger"
                      aria-label={`${employee.name}, ${employee.department}, ${employee.position}, ${employee.hireType}, ${targetCourses.length}개 중 ${completedCount}개 수료`}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setExpandedEmployeeId((currentValue) => (
                            currentValue === employeeValue ? '' : employeeValue
                          ));
                        }
                      }}
                    >
                      <span className="employee-summary__identity">
                        <strong>{employee.name}</strong>
                        <span>{employee.department}</span>
                      </span>
                      <span className="employee-summary__meta">
                        <span>{employee.position}</span>
                        <span className="employee-summary__meta-separator" aria-hidden="true">·</span>
                        <span>{employee.hireType}</span>
                      </span>
                      <span className="employee-summary__completion">
                        <strong>{completedCount}/{targetCourses.length}</strong>
                        <span>수료</span>
                      </span>
                      <span className="employee-accordion__chevron" aria-hidden="true">⌄</span>
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="employee-accordion__content">
                    {isRefreshing ? (
                      <div className="employee-accordion__status" role="status">
                        대상 교육 상태를 갱신하는 중…
                      </div>
                    ) : null}
                    <div className="target-course-checklist">
                      {targetCourses.length === 0 ? (
                        <EmptyView message={`${employee.name} 직원에게 연결된 대상 교육이 없습니다.`} />
                      ) : (
                        targetCourses.map((course) => {
                          const checkboxKey = `${employee.employeeId}-${course.courseId}`;
                          const isSaving = savingKeys.has(checkboxKey);

                          return (
                            <label className="course-check-item" key={course.courseId}>
                              <input
                                type="checkbox"
                                aria-label={`${employee.name} ${course.title} 수료`}
                                checked={course.completed}
                                disabled={isSaving}
                                onChange={(event) =>
                                  onCompletionChange({
                                    employeeId: employee.employeeId,
                                    courseId: course.courseId,
                                    completed: event.target.checked,
                                  })
                                }
                              />
                              <span className="course-check-item__title">{course.title}</span>
                              <em className={course.required ? 'status-badge' : 'status-badge status-badge--muted'}>
                                {displayRequired(course.required)}
                              </em>
                              <span className="course-check-item__saving" role="status" aria-live="polite">
                                {isSaving ? '저장 중…' : ''}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              );
            })}
          </Accordion.Root>
          <div className="pagination" aria-label="직원 목록 페이지">
            <button
              className="action-button action-button--secondary"
              type="button"
              disabled={currentPage === 1}
              onClick={() => changePage(Math.max(1, currentPage - 1))}
            >
              이전
            </button>
            <span aria-live="polite">{currentPage} / {totalPages}</span>
            <button
              className="action-button action-button--secondary"
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
            >
              다음
            </button>
          </div>
        </>
      )}
    </section>
  );
}

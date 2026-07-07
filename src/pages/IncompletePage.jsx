import { useEffect, useMemo, useState } from 'react';
import { fetchEmployeeTrainingStatuses, updateTrainingCompletion } from '../api/employeeTrainingApi.js';
import { fetchIncompleteTrainings } from '../api/trainingApi.js';
import EmployeeTrainingPanel from '../components/EmployeeTrainingPanel.jsx';
import EmptyView from '../components/EmptyView.jsx';
import ErrorView from '../components/ErrorView.jsx';
import LoadingView from '../components/LoadingView.jsx';

const COURSE_PAGE_SIZE = 5;
const EMPLOYEE_PAGE_SIZE = 5;

function safeNumber(value) {
  return value ?? 0;
}

function displayTarget(value) {
  return value === 'ALL' ? '전체' : value;
}

function displayRequired(required) {
  return required ? '필수' : '선택';
}

export default function IncompletePage() {
  const [results, setResults] = useState([]);
  const [employeeTrainingStatuses, setEmployeeTrainingStatuses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseTitleQuery, setCourseTitleQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [coursePage, setCoursePage] = useState(1);
  const [employeePage, setEmployeePage] = useState(1);
  const [employeePanelPage, setEmployeePanelPage] = useState(1);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [updateError, setUpdateError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadPageData({ resetSelection = false } = {}) {
    try {
      setIsLoading(true);
      setError(null);
      setUpdateError('');

      const [incompleteData, employeeTrainingData] = await Promise.all([
        fetchIncompleteTrainings(),
        fetchEmployeeTrainingStatuses(),
      ]);
      const nextResults = Array.isArray(incompleteData?.results) ? incompleteData.results : [];
      const nextEmployeeTrainingStatuses = Array.isArray(employeeTrainingData?.results)
        ? employeeTrainingData.results
        : [];

      setResults(nextResults);
      setEmployeeTrainingStatuses(nextEmployeeTrainingStatuses);

      if (resetSelection) {
        setSelectedCourseId(nextResults[0]?.courseId ?? null);
        setCoursePage(1);
        setEmployeePage(1);
        setEmployeePanelPage(1);
      }
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPageData({ resetSelection: true });
  }, []);

  const departments = useMemo(() => {
    const departmentSet = new Set();

    results.forEach((course) => {
      if (course.targetDepartment && course.targetDepartment !== 'ALL') {
        departmentSet.add(course.targetDepartment);
      }
      course.employees?.forEach((employee) => {
        if (employee.department) {
          departmentSet.add(employee.department);
        }
      });
    });
    return [...departmentSet].sort((a, b) => a.localeCompare(b, 'ko'));
  }, [results]);

  const filteredResults = useMemo(() => {
    const normalizedTitleQuery = courseTitleQuery.trim().toLowerCase();

    return results.filter((course) => {
      const matchesCourseTitle =
        normalizedTitleQuery === '' || course.courseTitle?.toLowerCase().includes(normalizedTitleQuery);

      const matchesDepartment =
        departmentFilter === '' ||
        course.targetDepartment === departmentFilter ||
        course.targetDepartment === 'ALL' ||
        course.employees?.some((employee) => employee.department === departmentFilter);

      return matchesCourseTitle && matchesDepartment;
    });
  }, [courseTitleQuery, departmentFilter, results]);

  useEffect(() => {
    setCoursePage(1);
  }, [courseTitleQuery, departmentFilter]);

  useEffect(() => {
    if (filteredResults.length === 0) {
      setSelectedCourseId(null);
      return;
    }
    const selectedCourseExists = filteredResults.some((course) => course.courseId === selectedCourseId);
    if (!selectedCourseExists) {
      setSelectedCourseId(filteredResults[0].courseId);
    }
  }, [filteredResults, selectedCourseId]);

  useEffect(() => {
    setEmployeePage(1);
  }, [selectedCourseId]);

  const courseTotalPages = Math.max(1, Math.ceil(filteredResults.length / COURSE_PAGE_SIZE));
  const currentCoursePage = Math.min(coursePage, courseTotalPages);
  const courseStartIndex = (currentCoursePage - 1) * COURSE_PAGE_SIZE;
  const pagedCourses = filteredResults.slice(courseStartIndex, courseStartIndex + COURSE_PAGE_SIZE);
  const courseEndIndex = courseStartIndex + pagedCourses.length;

  const selectedCourse = filteredResults.find((course) => course.courseId === selectedCourseId) ?? null;
  const selectedEmployees = Array.isArray(selectedCourse?.employees) ? selectedCourse.employees : [];
  const employeeTotalPages = Math.max(1, Math.ceil(selectedEmployees.length / EMPLOYEE_PAGE_SIZE));
  const currentEmployeePage = Math.min(employeePage, employeeTotalPages);
  const employeeStartIndex = (currentEmployeePage - 1) * EMPLOYEE_PAGE_SIZE;
  const pagedEmployees = selectedEmployees.slice(employeeStartIndex, employeeStartIndex + EMPLOYEE_PAGE_SIZE);
  const employeeEndIndex = employeeStartIndex + pagedEmployees.length;

  function resetFilters() {
    setCourseTitleQuery('');
    setDepartmentFilter('');
  }

  async function handleCompletionChange({ employeeId, courseId, completed }) {
    const nextUpdatingKey = `${employeeId}-${courseId}`;

    try {
      setUpdatingKey(nextUpdatingKey);
      setUpdateError('');
      await updateTrainingCompletion({ employeeId, courseId, completed });

      const [incompleteData, employeeTrainingData] = await Promise.all([
        fetchIncompleteTrainings(),
        fetchEmployeeTrainingStatuses(),
      ]);

      setResults(Array.isArray(incompleteData?.results) ? incompleteData.results : []);
      setEmployeeTrainingStatuses(Array.isArray(employeeTrainingData?.results) ? employeeTrainingData.results : []);
    } catch (requestError) {
      setUpdateError('교육 이수 상태를 변경하지 못했습니다. 다시 시도해주세요.');
    } finally {
      setUpdatingKey(null);
    }
  }

  if (isLoading) {
    return <LoadingView message="미수료자 데이터를 불러오는 중입니다." />;
  }

  if (error) {
    return <ErrorView message="미수료자 데이터를 불러오지 못했습니다. 백엔드 서버 상태를 확인해주세요." />;
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="page-kicker">Incomplete Training</p>
        <h1>교육 미수료자 자동 추출</h1>
        <p>교육 과정의 대상 부서와 입사 유형을 기준으로 대상 직원을 찾고, 아직 수료하지 않은 직원을 자동으로 표시합니다.</p>
      </div>

      <section className="toolbar-panel" aria-label="미수료자 필터">
        <button className="action-button" type="button" onClick={() => loadPageData({ resetSelection: true })}>
          미수료자 새로고침
        </button>
        <label className="field">
          <span>교육명 검색</span>
          <input
            type="search"
            value={courseTitleQuery}
            onChange={(event) => setCourseTitleQuery(event.target.value)}
            placeholder="교육명을 입력하세요"
          />
        </label>
        <label className="field">
          <span>부서 필터</span>
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option value="">전체 부서</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </label>
        <button className="action-button action-button--secondary" type="button" onClick={resetFilters}>
          필터 초기화
        </button>
      </section>

      {results.length === 0 ? (
        <EmptyView message="교육 미수료 현황이 없습니다." />
      ) : filteredResults.length === 0 ? (
        <EmptyView message="필터 조건에 맞는 미수료 현황이 없습니다." />
      ) : (
        <>
          <section className="dashboard-panel">
            <div className="section-heading">
              <h2>교육별 미수료 현황</h2>
              <p>교육별 대상 조건, 미수료자 수, 수료율을 확인합니다.</p>
            </div>
            <div className="list-summary">
              전체 {filteredResults.length}개 중 {courseStartIndex + 1}-{courseEndIndex}개 표시
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>교육명</th>
                    <th>카테고리</th>
                    <th>필수 여부</th>
                    <th>대상 부서</th>
                    <th>대상 입사 유형</th>
                    <th>대상 직원 수</th>
                    <th>미수료자 수</th>
                    <th>수료율</th>
                    <th>상세</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCourses.map((course) => (
                    <tr key={course.courseId}>
                      <td>{course.courseTitle}</td>
                      <td>{course.category ?? '없음'}</td>
                      <td>
                        <span className={course.required ? 'status-badge' : 'status-badge status-badge--muted'}>
                          {displayRequired(course.required)}
                        </span>
                      </td>
                      <td>{displayTarget(course.targetDepartment)}</td>
                      <td>{displayTarget(course.targetHireType)}</td>
                      <td>{safeNumber(course.targetEmployeeCount)}명</td>
                      <td>{safeNumber(course.incompleteCount)}명</td>
                      <td>{safeNumber(course.completionRate)}%</td>
                      <td>
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => {
                            setSelectedCourseId(course.courseId);
                            setEmployeePage(1);
                          }}
                        >
                          상세 보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button
                className="action-button action-button--secondary"
                type="button"
                disabled={currentCoursePage === 1}
                onClick={() => setCoursePage((page) => Math.max(1, page - 1))}
              >
                이전
              </button>
              <span>{currentCoursePage} / {courseTotalPages}</span>
              <button
                className="action-button action-button--secondary"
                type="button"
                disabled={currentCoursePage === courseTotalPages}
                onClick={() => setCoursePage((page) => Math.min(courseTotalPages, page + 1))}
              >
                다음
              </button>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="section-heading">
              <h2>{selectedCourse?.courseTitle ?? '교육 선택'} 미수료 직원</h2>
              <p>선택한 교육의 미수료 직원 상세 목록입니다.</p>
            </div>

            {!selectedCourse || selectedEmployees.length === 0 ? (
              <EmptyView message="이 교육의 미수료자가 없습니다." />
            ) : (
              <>
                <div className="list-summary">
                  미수료자 {selectedEmployees.length}명 중 {employeeStartIndex + 1}-{employeeEndIndex}명 표시
                </div>
                <div className="employee-list">
                  {pagedEmployees.map((employee) => (
                    <article className="employee-item" key={employee.employeeId}>
                      <strong>{employee.name}</strong>
                      <span>{employee.department}</span>
                      <span>{employee.position}</span>
                      <span>{employee.hireType}</span>
                    </article>
                  ))}
                </div>
                <div className="pagination">
                  <button
                    className="action-button action-button--secondary"
                    type="button"
                    disabled={currentEmployeePage === 1}
                    onClick={() => setEmployeePage((page) => Math.max(1, page - 1))}
                  >
                    이전
                  </button>
                  <span>{currentEmployeePage} / {employeeTotalPages}</span>
                  <button
                    className="action-button action-button--secondary"
                    type="button"
                    disabled={currentEmployeePage === employeeTotalPages}
                    onClick={() => setEmployeePage((page) => Math.min(employeeTotalPages, page + 1))}
                  >
                    다음
                  </button>
                </div>
              </>
            )}
          </section>

          {updateError ? <ErrorView message={updateError} /> : null}

          <EmployeeTrainingPanel
            employees={employeeTrainingStatuses}
            page={employeePanelPage}
            onPageChange={setEmployeePanelPage}
            onCompletionChange={handleCompletionChange}
            updatingKey={updatingKey}
          />
        </>
      )}
    </section>
  );
}

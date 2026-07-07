import { useState } from 'react';
import { searchCoursesWithAi } from '../api/aiSearchApi.js';
import EmptyView from '../components/EmptyView.jsx';
import ErrorView from '../components/ErrorView.jsx';
import LoadingView from '../components/LoadingView.jsx';

const exampleQueries = [
  '신입사원이 들어야 하는 필수 교육 찾아줘',
  '품질관리팀 식품안전 필수교육 찾아줘',
  'AI 업무 자동화 교육 보여줘',
  '개인정보보호 교육 찾아줘',
  '개발팀 교육 추천해줘',
];

const initialResponse = {
  interpretedCondition: null,
  reason: '',
  fallbackUsed: false,
  results: [],
};

function formatConditionValue(value, type) {
  if (value === null || value === undefined || value === '') {
    return type === 'required' ? '전체' : '없음';
  }
  if (type === 'required') {
    return value ? '필수' : '선택';
  }
  if (value === 'ALL' && type === 'department') {
    return '전체 부서';
  }
  if (value === 'ALL' && type === 'hireType') {
    return '전체 입사 유형';
  }
  return value;
}

function formatTarget(value, fallbackLabel) {
  if (value === 'ALL') {
    return fallbackLabel;
  }
  return value ?? '없음';
}

export default function AiSearchPage() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(initialResponse);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');

  async function submitSearch(nextQuery = query) {
    const trimmedQuery = nextQuery.trim();

    if (trimmedQuery.length === 0) {
      setError(null);
      setValidationMessage('검색어를 입력해주세요.');
      return;
    }
    if (trimmedQuery.length > 500) {
      setError(null);
      setValidationMessage('검색어는 500자 이하로 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setValidationMessage('');
      setHasSearched(true);
      const data = await searchCoursesWithAi(trimmedQuery);

      setResponse({
        ...initialResponse,
        ...data,
        interpretedCondition: data?.interpretedCondition ?? null,
        results: Array.isArray(data?.results) ? data.results : [],
      });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitSearch();
  }

  function runExample(exampleQuery) {
    setQuery(exampleQuery);
    submitSearch(exampleQuery);
  }

  function resetSearch() {
    setQuery('');
    setResponse(initialResponse);
    setHasSearched(false);
    setError(null);
    setValidationMessage('');
  }

  const condition = response.interpretedCondition;

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="page-kicker">AI Search</p>
        <h1>AI 교육 검색</h1>
        <p>자연어로 교육 과정을 검색하고 AI가 해석한 조건을 확인합니다.</p>
      </div>

      <section className="dashboard-panel">
        <form className="ai-search-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>자연어 검색</span>
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setValidationMessage('');
                setError(null);
              }}
              placeholder="예: 신입사원이 들어야 하는 필수 교육 찾아줘"
              maxLength={501}
            />
          </label>
          <button className="action-button" type="submit" disabled={isLoading}>
            검색
          </button>
          <button className="action-button action-button--secondary" type="button" onClick={resetSearch}>
            검색어 초기화
          </button>
        </form>

        {validationMessage ? <p className="form-message">{validationMessage}</p> : null}

        <div className="example-query-list" aria-label="예시 검색어">
          {exampleQueries.map((exampleQuery) => (
            <button className="text-button" type="button" key={exampleQuery} onClick={() => runExample(exampleQuery)}>
              {exampleQuery}
            </button>
          ))}
        </div>
      </section>

      {!hasSearched && !isLoading ? (
        <EmptyView message="검색어를 입력하거나 예시 검색어를 선택해 교육 과정을 찾아보세요." />
      ) : null}

      {isLoading ? <LoadingView message="AI가 검색 조건을 해석하는 중입니다." /> : null}

      {error ? <ErrorView message="AI 교육 검색 요청을 처리하지 못했습니다. 백엔드 서버 상태를 확인해주세요." /> : null}

      {hasSearched && !isLoading && !error ? (
        <>
          <section className="dashboard-panel">
            <div className="section-heading">
              <h2>AI 해석 결과</h2>
              <p>{response.reason || '해석 사유가 없습니다.'}</p>
            </div>

            {response.fallbackUsed ? (
              <div className="notice-box">AI 해석 실패로 일반 검색을 사용했습니다.</div>
            ) : null}

            <dl className="condition-grid">
              <div>
                <dt>keyword</dt>
                <dd>{formatConditionValue(condition?.keyword)}</dd>
              </div>
              <div>
                <dt>category</dt>
                <dd>{formatConditionValue(condition?.category)}</dd>
              </div>
              <div>
                <dt>required</dt>
                <dd>{formatConditionValue(condition?.required, 'required')}</dd>
              </div>
              <div>
                <dt>targetDepartment</dt>
                <dd>{formatConditionValue(condition?.targetDepartment, 'department')}</dd>
              </div>
              <div>
                <dt>targetHireType</dt>
                <dd>{formatConditionValue(condition?.targetHireType, 'hireType')}</dd>
              </div>
              <div>
                <dt>fallbackUsed</dt>
                <dd>{response.fallbackUsed ? '사용' : '미사용'}</dd>
              </div>
            </dl>
          </section>

          <section className="dashboard-panel">
            <div className="section-heading">
              <h2>검색 결과</h2>
              <p>AI가 해석한 조건으로 조회한 교육 과정입니다.</p>
            </div>

            {response.results.length === 0 ? (
              <EmptyView message="검색 결과가 없습니다." />
            ) : (
              <div className="course-result-list">
                {response.results.map((course) => (
                  <article className="course-result-item" key={course.courseId}>
                    <div>
                      <h3>{course.title}</h3>
                      <p>{course.description}</p>
                    </div>
                    <div className="course-tags">
                      <span>{course.category ?? '없음'}</span>
                      <span>{course.required ? '필수' : '선택'}</span>
                      <span>{formatTarget(course.targetDepartment, '전체 부서')}</span>
                      <span>{formatTarget(course.targetHireType, '전체 입사 유형')}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}

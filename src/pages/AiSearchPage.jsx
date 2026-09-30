import { useRef, useState } from 'react';
import { searchCoursesWithAi } from '../api/aiSearchApi.js';

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

function formatRawCondition(value, type) {
  if (value === null || value === undefined || value === '') {
    return type === 'required' ? '전체' : '조건 없음';
  }
  if (type === 'required') {
    return value ? '필수' : '선택';
  }
  if (value === 'ALL') {
    return '전체';
  }
  return value;
}

function formatCategorySummary(value) {
  if (!value) {
    return '전체 교육';
  }
  return value.endsWith('교육') ? value : `${value} 교육`;
}

function formatTarget(value, allLabel) {
  if (value === 'ALL') {
    return allLabel;
  }
  return value || '미지정';
}

function SearchInitialState() {
  return (
    <section className="ai-search-empty-state" aria-labelledby="ai-search-start-heading" role="status">
      <h2 id="ai-search-start-heading">검색 결과가 아직 없습니다.</h2>
      <p>찾고 싶은 교육의 대상, 분야, 필수 여부를 자연어로 입력하거나 위 예시를 선택해보세요.</p>
    </section>
  );
}

export default function AiSearchPage() {
  const requestIdRef = useRef(0);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(initialResponse);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInterpretationOpen, setIsInterpretationOpen] = useState(false);
  const [error, setError] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');

  async function submitSearch(nextQuery = query, { keepError = false } = {}) {
    const trimmedQuery = nextQuery.trim();

    if (isLoading) {
      return;
    }
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

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setIsLoading(true);
      if (!keepError) {
        setError(null);
      }
      setValidationMessage('');
      setHasSearched(true);
      setIsInterpretationOpen(false);
      const data = await searchCoursesWithAi(trimmedQuery);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setResponse({
        ...initialResponse,
        ...data,
        interpretedCondition: data?.interpretedCondition ?? null,
        results: Array.isArray(data?.results) ? data.results : [],
      });
      setError(null);
    } catch (requestError) {
      if (requestId === requestIdRef.current) {
        setError(requestError);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
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
    requestIdRef.current += 1;
    setQuery('');
    setResponse(initialResponse);
    setHasSearched(false);
    setIsLoading(false);
    setIsInterpretationOpen(false);
    setError(null);
    setValidationMessage('');
  }

  const condition = response.interpretedCondition;
  const resultCount = response.results.length;

  return (
    <section className="page-section ai-search-page">
      <div className="page-heading">
        <h1>AI 교육 검색</h1>
        <p>대상과 관심 분야를 자연어로 설명하면 검색 조건을 해석해 관련 교육을 찾아드립니다.</p>
      </div>

      <section className="dashboard-panel ai-search-panel" aria-labelledby="ai-search-form-heading">
        <div className="section-heading">
          <h2 id="ai-search-form-heading">어떤 교육을 찾고 있나요?</h2>
          <p>부서, 입사 유형, 교육 분야나 필수 여부를 함께 입력하면 더 정확하게 찾을 수 있습니다.</p>
        </div>

        <form className="ai-search-form" aria-label="AI 교육 자연어 검색" onSubmit={handleSubmit}>
          <div className="field ai-search-field">
            <div className="search-input-wrap">
              <svg className="search-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                id="ai-course-query"
                type="search"
                name="aiCourseQuery"
                autoComplete="off"
                aria-label="자연어 검색어"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setValidationMessage('');
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitSearch();
                  }
                }}
                placeholder="대상, 부서, 입사 유형, 교육 분야 등을 자연어로 입력 (500자 이내)"
                maxLength={501}
                aria-describedby={validationMessage ? 'ai-search-validation' : 'ai-search-help'}
              />
            </div>
            <span className="visually-hidden" id="ai-search-help">검색어는 500자 이내로 입력해주세요.</span>
          </div>
          <div className="ai-search-actions">
            <button className="action-button" type="submit" disabled={isLoading}>
              {isLoading ? '검색 중…' : '교육 검색'}
            </button>
            <button className="action-button action-button--secondary" type="button" onClick={resetSearch}>
              검색 초기화
            </button>
          </div>
        </form>

        {validationMessage ? (
          <p className="form-message" id="ai-search-validation" role="alert">{validationMessage}</p>
        ) : null}

        <div className="ai-search-examples">
          <strong>이렇게 검색해보세요</strong>
          <div className="example-query-list" aria-label="예시 검색어">
            {exampleQueries.map((exampleQuery) => (
              <button
                className="text-button example-query-button"
                type="button"
                key={exampleQuery}
                disabled={isLoading}
                onClick={() => runExample(exampleQuery)}
              >
                {exampleQuery}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!hasSearched && !isLoading ? <SearchInitialState /> : null}

      {isLoading && !error ? (
        <section className="ai-search-loading" role="status" aria-live="polite" aria-busy="true">
          <span className="ai-search-loading__indicator" aria-hidden="true" />
          <div>
            <h2>조건을 해석하고 있어요.</h2>
            <p>입력한 표현에서 교육 분야와 대상 조건을 확인하고 있습니다.</p>
          </div>
        </section>
      ) : null}

      {error ? (
        <section className="ai-search-error" role="alert" aria-labelledby="ai-search-error-heading">
          <div>
            <h2 id="ai-search-error-heading">교육을 검색하지 못했습니다.</h2>
            <p>입력한 검색어는 그대로 유지했습니다. 잠시 후 다시 시도해주세요.</p>
          </div>
          <button
            className="action-button"
            type="button"
            disabled={isLoading}
            onClick={() => submitSearch(query, { keepError: true })}
          >
            {isLoading ? '다시 검색 중…' : '다시 시도'}
          </button>
        </section>
      ) : null}

      {hasSearched && !isLoading && !error ? (
        <div className={`ai-search-response${response.fallbackUsed ? ' has-fallback' : ''}`}>
          <section className="dashboard-panel ai-interpretation" aria-labelledby="ai-interpretation-heading">
            <div className="section-heading">
              <h2 id="ai-interpretation-heading">이렇게 이해했어요</h2>
              <p>{response.reason || '입력한 검색어를 기준으로 교육을 찾았습니다.'}</p>
            </div>

            <ul className="condition-summary-list" aria-label="검색 조건 요약">
              <li><strong>{formatCategorySummary(condition?.category)}</strong></li>
              <li>대상 부서: {formatRawCondition(condition?.targetDepartment, 'department')}</li>
              <li>대상 입사 유형: {formatRawCondition(condition?.targetHireType, 'hireType')}</li>
              <li>필수 여부: {formatRawCondition(condition?.required, 'required')}</li>
            </ul>

            <details
              className="interpretation-details"
              open={isInterpretationOpen}
              onToggle={(event) => setIsInterpretationOpen(event.currentTarget.open)}
            >
              <summary
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsInterpretationOpen((currentValue) => !currentValue);
                  }
                }}
              >
                검색 해석 상세
              </summary>
              <dl className="interpretation-details__list">
                <div>
                  <dt>카테고리</dt>
                  <dd>{formatRawCondition(condition?.category, 'category')}</dd>
                </div>
                <div>
                  <dt>대상 부서</dt>
                  <dd>{formatRawCondition(condition?.targetDepartment, 'department')}</dd>
                </div>
                <div>
                  <dt>대상 입사 유형</dt>
                  <dd>{formatRawCondition(condition?.targetHireType, 'hireType')}</dd>
                </div>
                <div>
                  <dt>필수 여부</dt>
                  <dd>{formatRawCondition(condition?.required, 'required')}</dd>
                </div>
                <div>
                  <dt>검색 키워드</dt>
                  <dd>{formatRawCondition(condition?.keyword, 'keyword')}</dd>
                </div>
                <div>
                  <dt>검색 범위 확장</dt>
                  <dd>{response.fallbackUsed ? '적용' : '미적용'}</dd>
                </div>
              </dl>
            </details>
          </section>

          {response.fallbackUsed ? (
            <div className="notice-box ai-fallback-notice" role="status">
              <strong>검색 범위를 넓혔습니다.</strong>
              <span>일치 조건이 적어 관련 교육으로 범위를 넓혀 검색했어요.</span>
            </div>
          ) : null}

          <section
            className={`dashboard-panel ai-search-results${resultCount > 0 ? ' ai-search-results--success' : ''}`}
            aria-labelledby={resultCount > 0 ? 'ai-search-results-heading' : undefined}
            aria-label={resultCount === 0 ? '검색 결과' : undefined}
          >
            {resultCount > 0 ? (
              <div className="ai-search-results__heading">
                <h2 id="ai-search-results-heading">검색 결과</h2>
                <strong className="result-count" role="status" aria-live="polite">
                  검색 결과 {resultCount}건
                </strong>
              </div>
            ) : null}

            {resultCount === 0 ? (
              <div className="ai-search-empty-results" role="status">
                <h3>조건에 맞는 교육을 찾지 못했어요.</h3>
                <p>검색 조건을 조금 바꾸거나 다른 예시로 다시 검색해보세요.</p>
                <button className="action-button action-button--secondary" type="button" onClick={resetSearch}>
                  검색 초기화
                </button>
              </div>
            ) : (
              <ul className="course-result-list">
                {response.results.map((course) => (
                  <li className="course-result-item" key={course.courseId}>
                    <article>
                      <h3>{course.title}</h3>
                      <p>{course.description || '교육 설명이 없습니다.'}</p>
                      <dl className="course-result-item__targets">
                        <div>
                          <dt>대상 부서</dt>
                          <dd>{formatTarget(course.targetDepartment, '전체 부서')}</dd>
                        </div>
                        <div>
                          <dt>대상 입사 유형</dt>
                          <dd>{formatTarget(course.targetHireType, '전체 입사 유형')}</dd>
                        </div>
                      </dl>
                      <div className="course-result-item__badges" aria-label="교육 구분">
                        <span>{course.category || '카테고리 미지정'}</span>
                        <span>{course.required ? '필수' : '선택'}</span>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}

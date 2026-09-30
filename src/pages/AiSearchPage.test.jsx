import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { aiSearchFixture, cloneFixture } from '../test/fixtures.js';
import { renderWithProviders } from '../test/render.jsx';
import { server } from '../test/server.js';
import AiSearchPage from './AiSearchPage.jsx';

const searchInputName = /자연어 검색어/;

describe('AiSearchPage', () => {
  it('초기 안내를 보여주고 빈 값과 500자 초과 입력을 검증한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AiSearchPage />, { route: '/ai-search' });

    expect(screen.getByText('검색 결과가 아직 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '신입사원이 들어야 하는 필수 교육 찾아줘' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: searchInputName })).toHaveAttribute('name', 'aiCourseQuery');
    expect(screen.getByRole('searchbox', { name: searchInputName })).toHaveAttribute('autocomplete', 'off');
    await user.click(screen.getByRole('button', { name: '교육 검색' }));
    expect(screen.getByRole('alert')).toHaveTextContent('검색어를 입력해주세요.');

    await user.type(screen.getByRole('searchbox', { name: searchInputName }), '가'.repeat(501));
    await user.click(screen.getByRole('button', { name: '교육 검색' }));
    expect(screen.getByRole('alert')).toHaveTextContent('검색어는 500자 이하로 입력해주세요.');
  });

  it.each(['button', 'enter'])('%s로 검색하고 해석, 상세 조건, 결과를 표시한다', async (method) => {
    let requestBody;
    server.use(
      http.post('/api/ai/course-search', async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(cloneFixture(aiSearchFixture));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<AiSearchPage />, { route: '/ai-search' });
    const input = screen.getByRole('searchbox', { name: searchInputName });
    await user.type(input, 'AI 업무 자동화 교육');

    if (method === 'enter') {
      await user.keyboard('{Enter}');
    } else {
      await user.click(screen.getByRole('button', { name: '교육 검색' }));
    }

    expect(await screen.findByRole('heading', { name: '이렇게 이해했어요' })).toBeInTheDocument();
    expect(requestBody).toEqual({ query: 'AI 업무 자동화 교육' });
    expect(screen.getByText('AI 교육')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'AI 업무 자동화 기초' })).toBeInTheDocument();
    expect(screen.getByText('검색 결과 1건')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '검색 결과' }).closest('section')).toHaveClass(
      'ai-search-results--success',
    );
    expect(screen.queryByText('category:')).not.toBeInTheDocument();
    expect(screen.queryByText('targetDepartment:')).not.toBeInTheDocument();
    expect(screen.queryByText('targetHireType:')).not.toBeInTheDocument();
    expect(screen.queryByText('keyword:')).not.toBeInTheDocument();
    expect(screen.queryByText('fallbackUsed:')).not.toBeInTheDocument();
    expect(screen.queryByText('검색 범위를 넓혔습니다.')).not.toBeInTheDocument();

    await user.click(screen.getByText('검색 해석 상세'));
    const details = screen.getByText('검색 해석 상세').closest('details');
    expect(details).toHaveAttribute('open');
    expect(within(details).getByText('카테고리')).toBeInTheDocument();
    expect(within(details).getByText('AI')).toBeInTheDocument();
    expect(within(details).getByText('검색 키워드')).toBeInTheDocument();
    expect(within(details).getByText('업무 자동화')).toBeInTheDocument();
    expect(within(details).getByText('검색 범위 확장')).toBeInTheDocument();
    expect(within(details).getByText('미적용')).toBeInTheDocument();
  });

  it('여러 교육을 각각의 결과 항목으로 표시하고 실제 결과 수를 건 단위로 알린다', async () => {
    server.use(
      http.post('/api/ai/course-search', () => HttpResponse.json({
        ...aiSearchFixture,
        results: [
          aiSearchFixture.results[0],
          { ...aiSearchFixture.results[0], courseId: 8, title: '데이터 기반 업무 분석', category: '데이터' },
          { ...aiSearchFixture.results[0], courseId: 10, title: '협업 커뮤니케이션 교육', category: '조직문화' },
        ],
      })),
    );
    const user = userEvent.setup();
    renderWithProviders(<AiSearchPage />, { route: '/ai-search' });

    await user.type(screen.getByRole('searchbox', { name: searchInputName }), '업무 교육');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('검색 결과 3건')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.queryByText('해석한 조건과 일치하는 교육 과정입니다.')).not.toBeInTheDocument();
  });

  it('검색 중 status를 알리고 제출과 예시 버튼만 비활성화한다', async () => {
    server.use(
      http.post('/api/ai/course-search', async () => {
        await delay(80);
        return HttpResponse.json(cloneFixture(aiSearchFixture));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<AiSearchPage />, { route: '/ai-search' });
    const input = screen.getByRole('searchbox', { name: searchInputName });
    await user.type(input, 'AI 교육');
    await user.click(screen.getByRole('button', { name: '교육 검색' }));

    expect(screen.getByText('조건을 해석하고 있어요.').closest('[role="status"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '검색 중…' })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /찾아줘|보여줘|추천해줘/ })[0]).toBeDisabled();
    expect(input).toBeEnabled();
    await screen.findByText('검색 결과 1건');
  });

  it('결과 없음 안내 후 검색을 초기 상태로 되돌린다', async () => {
    server.use(
      http.post('/api/ai/course-search', () => HttpResponse.json({ ...aiSearchFixture, results: [] })),
    );
    const user = userEvent.setup();
    renderWithProviders(<AiSearchPage />, { route: '/ai-search' });
    const input = screen.getByRole('searchbox', { name: searchInputName });
    await user.type(input, '없는 교육');
    await user.keyboard('{Enter}');

    const emptyResult = await screen.findByText('조건에 맞는 교육을 찾지 못했어요.');
    expect(emptyResult).toBeInTheDocument();
    expect(emptyResult.closest('section')).not.toHaveClass('ai-search-results--success');
    expect(screen.queryByRole('heading', { name: '검색 결과' })).not.toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: '검색 초기화' })[1]);
    expect(input).toHaveValue('');
    expect(screen.getByText('검색 결과가 아직 없습니다.')).toBeInTheDocument();
  });

  it('오류 시 입력을 유지하고 같은 검색어로 재시도한다', async () => {
    let requestCount = 0;
    const queries = [];
    server.use(
      http.post('/api/ai/course-search', async ({ request }) => {
        requestCount += 1;
        queries.push((await request.json()).query);
        return requestCount === 1
          ? HttpResponse.json({ message: 'failed' }, { status: 500 })
          : HttpResponse.json(cloneFixture(aiSearchFixture));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<AiSearchPage />, { route: '/ai-search' });
    const input = screen.getByRole('searchbox', { name: searchInputName });
    await user.type(input, '다시 찾을 교육');
    await user.click(screen.getByRole('button', { name: '교육 검색' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('교육을 검색하지 못했습니다.');
    expect(input).toHaveValue('다시 찾을 교육');
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('검색 결과 1건')).toBeInTheDocument();
    expect(queries).toEqual(['다시 찾을 교육', '다시 찾을 교육']);
  });

  it('fallback 사용 여부에 따라 안내를 정확히 구분한다', async () => {
    server.use(
      http.post('/api/ai/course-search', () => HttpResponse.json({ ...aiSearchFixture, fallbackUsed: true })),
    );
    const user = userEvent.setup();
    renderWithProviders(<AiSearchPage />, { route: '/ai-search' });
    await user.type(screen.getByRole('searchbox', { name: searchInputName }), '넓게 검색');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('검색 범위를 넓혔습니다.')).toBeInTheDocument();
    await user.click(screen.getByText('검색 해석 상세'));
    expect(screen.getByText('적용')).toBeInTheDocument();
  });

  it('초기화 뒤 시작한 최신 검색을 이전의 늦은 응답이 덮어쓰지 않는다', async () => {
    server.use(
      http.post('/api/ai/course-search', async ({ request }) => {
        const { query } = await request.json();
        if (query === '느린 검색') {
          await delay(120);
          return HttpResponse.json({
            ...aiSearchFixture,
            results: [{ ...aiSearchFixture.results[0], courseId: 90, title: '이전 결과' }],
          });
        }
        return HttpResponse.json({
          ...aiSearchFixture,
          results: [{ ...aiSearchFixture.results[0], courseId: 91, title: '최신 결과' }],
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<AiSearchPage />, { route: '/ai-search' });
    const input = screen.getByRole('searchbox', { name: searchInputName });
    await user.type(input, '느린 검색');
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: '검색 초기화' }));
    await user.type(input, '최신 검색');
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { name: '최신 결과' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('heading', { name: '이전 결과' })).not.toBeInTheDocument(), {
      timeout: 250,
    });
  });
});

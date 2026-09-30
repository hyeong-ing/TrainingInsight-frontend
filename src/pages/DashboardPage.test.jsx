import { delay, http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { server } from '../test/server.js';
import { cloneFixture, dashboardFixture } from '../test/fixtures.js';
import { renderWithProviders } from '../test/render.jsx';
import DashboardPage from './DashboardPage.jsx';

describe('DashboardPage', () => {
  it('5개 KPI와 필수교육 표, 접근 가능한 progress bar를 표시한다', async () => {
    renderWithProviders(<DashboardPage />, { route: '/dashboard' });

    expect(await screen.findByText('24명')).toBeInTheDocument();
    expect(screen.getByText('13개')).toBeInTheDocument();
    expect(screen.getByText('5개')).toBeInTheDocument();
    expect(screen.getByText('36%')).toBeInTheDocument();
    expect(screen.getByText('33건')).toBeInTheDocument();
    expect(screen.getByText('필수교육 미수료 건수')).toBeInTheDocument();

    const kpiLabels = within(screen.getByLabelText('교육 운영 주요 지표'))
      .getAllByRole('heading')
      .map((heading) => heading.textContent);
    expect(kpiLabels).toEqual([
      '필수교육 미수료 건수',
      '전체 직원',
      '전체 교육',
      '필수 교육',
      '전체 수료율',
    ]);

    const table = screen.getByRole('table', { name: '필수교육별 미수료 건수와 수료율' });
    expect(within(table).getAllByRole('row')).toHaveLength(6);
    expect(within(table).getByRole('rowheader', { name: '개인정보보호 교육' })).toBeInTheDocument();

    const progress = screen.getByRole('progressbar', { name: '개인정보보호 교육 수료율' });
    expect(progress).toHaveAttribute('aria-valuenow', '67');
    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '100');
    expect(screen.queryByText(/대상 인원/)).not.toBeInTheDocument();
    expect(screen.queryByText(/증감률|예측|추세/)).not.toBeInTheDocument();
  });

  it('오류 안내 후 재시도로 정상 데이터를 복구한다', async () => {
    let requestCount = 0;
    server.use(
      http.get('/api/dashboard', () => {
        requestCount += 1;
        return requestCount === 1
          ? HttpResponse.json({ message: 'failed' }, { status: 500 })
          : HttpResponse.json(cloneFixture(dashboardFixture));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<DashboardPage />, { route: '/dashboard' });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('대시보드 정보를 불러오지 못했습니다.');
    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByText('24명')).toBeInTheDocument();
    expect(requestCount).toBe(2);
  });

  it('필수교육 통계가 비어 있으면 empty 안내를 표시한다', async () => {
    server.use(
      http.get('/api/dashboard', () => HttpResponse.json({ ...dashboardFixture, requiredCourseStats: [] })),
    );
    renderWithProviders(<DashboardPage />, { route: '/dashboard' });

    expect(await screen.findByText('표시할 필수교육 현황이 없습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('응답 대기 중 status와 aria-busy loading 상태를 표시한다', async () => {
    server.use(
      http.get('/api/dashboard', async () => {
        await delay(80);
        return HttpResponse.json(cloneFixture(dashboardFixture));
      }),
    );
    const { container } = renderWithProviders(<DashboardPage />, { route: '/dashboard' });

    expect(screen.getByRole('status', { name: '대시보드 데이터를 불러오는 중입니다.' })).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('24명')).toBeInTheDocument());
  });
});

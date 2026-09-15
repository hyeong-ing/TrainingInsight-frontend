import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { queryKeys } from '../queryClient.js';
import {
  cloneFixture,
  employeeTrainingFixture,
  incompleteFixture,
} from '../test/fixtures.js';
import { renderWithProviders } from '../test/render.jsx';
import { server } from '../test/server.js';
import IncompletePage from './IncompletePage.jsx';

describe('IncompletePage course view', () => {
  it.each(['/incomplete', '/incomplete?view=unknown'])('%s는 교육별 미수료를 기본 view로 사용한다', async (route) => {
    renderWithProviders(<IncompletePage />, { route });

    expect(await screen.findByRole('heading', { name: '교육별 미수료 현황' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '교육별 미수료' })).toHaveAttribute('aria-selected', 'true');
  });

  it('교육 현황 오류에서 해당 목록만 다시 불러와 복구한다', async () => {
    let requestCount = 0;
    server.use(
      http.get('/api/trainings/incomplete', () => {
        requestCount += 1;
        return requestCount === 1
          ? HttpResponse.json({ message: 'failed' }, { status: 500 })
          : HttpResponse.json(cloneFixture(incompleteFixture));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<IncompletePage />, { route: '/incomplete?view=course' });

    expect(await screen.findByRole('alert')).toHaveTextContent('교육별 미수료 현황을 불러오지 못했습니다.');
    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('heading', { name: '교육별 미수료 현황' })).toBeInTheDocument();
    expect(requestCount).toBe(2);
  });

  it('탭과 query parameter를 동기화하고 교육별/직원별 화면을 전환한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncompletePage />, { route: '/incomplete?view=course' });

    const courseTab = screen.getByRole('tab', { name: '교육별 미수료' });
    const employeeTab = screen.getByRole('tab', { name: '직원별 이수 상태' });
    expect(document.querySelectorAll('.incomplete-tabs__indicator')).toHaveLength(1);
    expect(courseTab).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('heading', { name: '교육별 미수료 현황' })).toBeInTheDocument();

    await user.click(employeeTab);
    expect(screen.getByTestId('location')).toHaveTextContent('/incomplete?view=employee');
    expect(employeeTab).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('heading', { name: '직원별 교육 이수 상태' })).toBeInTheDocument();

    await user.click(courseTab);
    expect(screen.getByTestId('location')).toHaveTextContent('/incomplete?view=course');
  });

  it('Arrow 키로 focus를 이동하고 Enter와 Space로 수동 활성화한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncompletePage />, { route: '/incomplete?view=course' });
    const courseTab = screen.getByRole('tab', { name: '교육별 미수료' });
    const employeeTab = screen.getByRole('tab', { name: '직원별 이수 상태' });

    courseTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(employeeTab).toHaveFocus();
    expect(courseTab).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(employeeTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('location')).toHaveTextContent('/incomplete?view=employee');

    await user.keyboard('{ArrowLeft}');
    expect(courseTab).toHaveFocus();
    await user.keyboard(' ');
    expect(courseTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('location')).toHaveTextContent('/incomplete?view=course');
  });

  it('교육명 검색, 초기화와 5개 단위 pagination을 제공한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncompletePage />, { route: '/incomplete?view=course' });
    expect(await screen.findByText('전체 6개 · 1–5개 표시')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /상세 보기:/ })).toHaveLength(5);

    const pagination = screen.getByLabelText('교육 목록 페이지');
    await user.click(within(pagination).getByRole('button', { name: '다음' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '상세 보기: AI 업무 자동화 기초' })).toBeInTheDocument();

    const search = await screen.findByRole('searchbox', { name: '교육명 검색' });
    const resetButton = screen.getByRole('button', { name: '검색 초기화' });
    expect(resetButton).toBeDisabled();
    await user.type(search, '식품안전');
    expect(resetButton).toBeEnabled();
    expect(screen.getByText('전체 1개 · 1–1개 표시')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '식품안전 교육' })).toBeInTheDocument();

    expect(screen.queryByRole('combobox', { name: '부서 필터' })).not.toBeInTheDocument();
    await user.click(resetButton);
    expect(search).toHaveValue('');
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('drawer 선택, 상세 pagination, 닫기와 다시 열기 상태를 보존한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncompletePage />, { route: '/incomplete?view=course' });
    const trigger = await screen.findByRole('button', { name: '상세 보기: 개인정보보호 교육' });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: '개인정보보호 교육' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-describedby', 'course-drawer-description');
    expect(within(dialog).getByText('교육 대상 조건과 미수료 직원 현황입니다.')).toBeInTheDocument();
    expect(within(dialog).getByText('법정교육')).toBeInTheDocument();
    expect(within(dialog).getByText('12명')).toBeInTheDocument();
    expect(trigger.closest('tr')).toHaveClass('is-drawer-selected');
    const drawerPagination = within(dialog).getByLabelText('미수료 직원 페이지');
    await user.click(within(drawerPagination).getByRole('button', { name: '다음' }));
    expect(within(dialog).getByText('2 / 2')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: '개인정보보호 교육' })).toHaveTextContent('2 / 2');
  });

  it('검색과 pagination 상태를 drawer 사용 뒤에도 유지한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncompletePage />, { route: '/incomplete?view=course' });
    const search = await screen.findByRole('searchbox', { name: '교육명 검색' });
    await user.type(search, ' ');
    const pagination = await screen.findByLabelText('교육 목록 페이지');
    await user.click(within(pagination).getByRole('button', { name: '다음' }));
    const trigger = screen.getByRole('button', { name: '상세 보기: AI 업무 자동화 기초' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: '교육 상세 닫기' }));

    expect(search).toHaveValue(' ');
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });
});

describe('IncompletePage employee view and completion mutation', () => {
  it('직원별 view를 직접 열어 accordion과 checkbox를 표시한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncompletePage />, { route: '/incomplete?view=employee' });
    const trigger = await screen.findByRole('button', { name: /김민지/ });
    expect(screen.getByRole('tab', { name: '직원별 이수 상태' })).toHaveAttribute('aria-selected', 'true');
    await user.click(trigger);
    expect(screen.getByRole('checkbox', { name: '김민지 개인정보보호 교육 수료' })).toBeChecked();
  });

  it('직원 교육 상태 오류에서 해당 목록만 다시 불러와 복구한다', async () => {
    let requestCount = 0;
    server.use(
      http.get('/api/employees/training-status', () => {
        requestCount += 1;
        return requestCount === 1
          ? HttpResponse.json({ message: 'failed' }, { status: 500 })
          : HttpResponse.json(cloneFixture(employeeTrainingFixture));
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<IncompletePage />, { route: '/incomplete?view=employee' });

    expect(await screen.findByRole('alert')).toHaveTextContent('직원별 이수 상태를 불러오지 못했습니다.');
    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(await screen.findByRole('heading', { name: '직원별 교육 이수 상태' })).toBeInTheDocument();
    expect(requestCount).toBe(2);
  });

  it('저장 중 해당 checkbox만 막고 성공 시 3개 query를 무효화해 최신 상태를 표시한다', async () => {
    let saved = false;
    let patchBody;
    server.use(
      http.get('/api/employees/training-status', () => {
        const fixture = cloneFixture(employeeTrainingFixture);
        fixture.results[0].targetCourses[1].completed = saved;
        fixture.results[0].targetCourses[1].status = saved ? 'COMPLETED' : 'NOT_STARTED';
        return HttpResponse.json(fixture);
      }),
      http.patch('/api/training-records/completion', async ({ request }) => {
        patchBody = await request.json();
        await delay(80);
        saved = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(<IncompletePage />, { route: '/incomplete?view=employee' });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const trigger = await screen.findByRole('button', { name: /김민지/ });
    await user.click(trigger);
    const changedCheckbox = screen.getByRole('checkbox', { name: '김민지 윤리경영 및 준법 교육 수료' });
    const otherCheckbox = screen.getByRole('checkbox', { name: '김민지 개인정보보호 교육 수료' });
    await user.click(changedCheckbox);

    expect(changedCheckbox).toBeDisabled();
    expect(otherCheckbox).toBeEnabled();
    expect(screen.getByText('저장 중…')).toBeInTheDocument();
    await waitFor(() => expect(changedCheckbox).toBeChecked());
    expect(patchBody).toEqual({ employeeId: 1, courseId: 2, completed: true });
    expect(await screen.findByText('수료 상태를 변경했어요.')).toBeInTheDocument();

    const invalidatedKeys = invalidateSpy.mock.calls.map(([filters]) => filters.queryKey);
    expect(invalidatedKeys).toContainEqual(queryKeys.employeeTrainingStatuses);
    expect(invalidatedKeys).toContainEqual(queryKeys.incompleteTrainings);
    expect(invalidatedKeys).toContainEqual(queryKeys.dashboard);
    expect(screen.getByRole('button', { name: /김민지.*2개 중 2개 수료/ })).toBeInTheDocument();
  });

  it('저장 실패 시 기존 checkbox 상태를 유지하고 오류를 안내하며 다른 control을 막지 않는다', async () => {
    server.use(
      http.patch('/api/training-records/completion', async () => {
        await delay(40);
        return HttpResponse.json({ message: 'failed' }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<IncompletePage />, { route: '/incomplete?view=employee' });
    await user.click(await screen.findByRole('button', { name: /김민지/ }));
    const changedCheckbox = screen.getByRole('checkbox', { name: '김민지 윤리경영 및 준법 교육 수료' });
    const otherCheckbox = screen.getByRole('checkbox', { name: '김민지 개인정보보호 교육 수료' });
    await user.click(changedCheckbox);

    expect(await screen.findByRole('alert')).toHaveTextContent('수료 상태를 변경하지 못했어요.');
    expect(changedCheckbox).not.toBeChecked();
    expect(changedCheckbox).toBeEnabled();
    expect(otherCheckbox).toBeEnabled();
    expect(screen.getByRole('button', { name: /이준호.*2개 중 0개 수료/ })).toBeInTheDocument();
  });
});

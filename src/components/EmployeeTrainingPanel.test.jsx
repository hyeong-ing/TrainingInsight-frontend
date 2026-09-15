import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { cloneFixture, employeeTrainingFixture } from '../test/fixtures.js';
import EmployeeTrainingPanel from './EmployeeTrainingPanel.jsx';

function PanelHarness() {
  const [page, setPage] = useState(1);
  return (
    <EmployeeTrainingPanel
      employees={cloneFixture(employeeTrainingFixture.results)}
      page={page}
      onPageChange={setPage}
      onCompletionChange={vi.fn()}
      savingKeys={new Set()}
      isRefreshing={false}
    />
  );
}

describe('EmployeeTrainingPanel', () => {
  it('처음에는 닫혀 있고 한 직원만 펼친다', async () => {
    const user = userEvent.setup();
    render(<PanelHarness />);
    expect(screen.getByText('전체 6명 · 1–5명 표시')).toBeInTheDocument();
    const kim = screen.getByRole('button', { name: /김민지/ });
    const lee = screen.getByRole('button', { name: /이준호/ });

    expect(screen.getAllByRole('button', { name: /개 중 .*개 수료/ })).toHaveLength(5);
    expect(kim).toHaveAttribute('aria-expanded', 'false');
    await user.click(kim);
    expect(kim).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('checkbox', { name: '김민지 개인정보보호 교육 수료' })).toBeInTheDocument();

    await user.click(lee);
    expect(kim).toHaveAttribute('aria-expanded', 'false');
    expect(lee).toHaveAttribute('aria-expanded', 'true');
  });

  it('Enter와 Space keyboard로 열고 닫을 수 있다', async () => {
    const user = userEvent.setup();
    render(<PanelHarness />);
    const trigger = screen.getByRole('button', { name: /김민지/ });
    trigger.focus();

    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('페이지를 이동하면 열린 직원을 닫고 다음 직원 범위를 표시한다', async () => {
    const user = userEvent.setup();
    render(<PanelHarness />);
    const trigger = screen.getByRole('button', { name: /김민지/ });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const pagination = screen.getByLabelText('직원 목록 페이지');
    await user.click(within(pagination).getByRole('button', { name: '다음' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /오하늘/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: /김민지/ })).not.toBeInTheDocument();
  });
});

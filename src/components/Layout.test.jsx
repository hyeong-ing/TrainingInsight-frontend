import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Layout from './Layout.jsx';

describe('Layout', () => {
  it('본문 바로가기와 현재 위치가 표시된 주요 navigation을 제공한다', () => {
    render(
      <MemoryRouter
        initialEntries={['/incomplete']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Layout><h1>교육 현황</h1></Layout>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '본문으로 바로가기' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('link', { name: '교육 현황' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'TrainingInsight' })).toHaveAttribute('translate', 'no');
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });
});

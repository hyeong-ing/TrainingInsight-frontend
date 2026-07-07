import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: '대시보드' },
  { to: '/incomplete', label: '미수료자 자동 추출' },
  { to: '/ai-search', label: 'AI 교육 검색' },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/dashboard" className="site-logo">
          TrainingInsight
        </NavLink>
        <nav className="site-nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'site-nav__link is-active' : 'site-nav__link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

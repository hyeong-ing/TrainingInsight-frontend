import { useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: '대시보드' },
  { to: '/incomplete', label: '교육 현황' },
  { to: '/ai-search', label: 'AI 교육 검색' },
];

export default function Header() {
  const location = useLocation();
  const navRef = useRef(null);
  const linkRefs = useRef([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });
  const activeIndex = navItems.findIndex(({ to }) => (
    location.pathname === to || location.pathname.startsWith(`${to}/`)
  ));

  useLayoutEffect(() => {
    function updateIndicator() {
      const activeLink = linkRefs.current[activeIndex];
      const nav = navRef.current;
      if (!activeLink || !nav) {
        return;
      }

      const activeLinkRect = activeLink.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();

      const nextIndicator = {
        left: activeLinkRect.left - navRect.left + nav.scrollLeft,
        width: activeLinkRect.width,
        ready: true,
      };
      setIndicator((currentIndicator) => (
        currentIndicator.left === nextIndicator.left && currentIndicator.width === nextIndicator.width
          ? currentIndicator
          : nextIndicator
      ));
    }

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateIndicator);
    if (navRef.current) {
      resizeObserver?.observe(navRef.current);
    }
    linkRefs.current.forEach((link) => {
      if (link) {
        resizeObserver?.observe(link);
      }
    });

    return () => {
      window.removeEventListener('resize', updateIndicator);
      resizeObserver?.disconnect();
    };
  }, [activeIndex]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/dashboard" className="site-logo" translate="no">
          TrainingInsight
        </Link>
        <nav className="site-nav" aria-label="주요 메뉴" ref={navRef}>
          <span
            className={`site-nav__indicator${indicator.ready ? ' is-ready' : ''}`}
            style={{ transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px` }}
            aria-hidden="true"
          />
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              ref={(element) => {
                linkRefs.current[index] = element;
              }}
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

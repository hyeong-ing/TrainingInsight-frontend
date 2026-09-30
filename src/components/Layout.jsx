import Header from './Header.jsx';

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>
      <Header />
      <main className="page-container" id="main-content" tabIndex="-1">{children}</main>
    </div>
  );
}

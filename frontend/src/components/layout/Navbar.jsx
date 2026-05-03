import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import logo from '../../assets/taskara-logo.png';

function Navbar() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const [lastPath, setLastPath] = useState(location.pathname);

  // Close the drawer whenever the route changes (adjust during render)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    if (menuOpen) setMenuOpen(false);
  }

  const login = () => loginWithRedirect();
  const signup = () => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });
  const handleLogout = () => logout({ logoutParams: { returnTo: window.location.origin } });

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen((v) => !v);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (!menuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [menuOpen]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <nav className="site-nav">
      <Link to="/" className="brand-link" onClick={closeMenu}>
        <img src={logo} alt="" className="brand-logo" aria-hidden="true" />
        <span className="brand-text">Taskara</span>
      </Link>

      <button
        type="button"
        className={`nav-toggle ${menuOpen ? 'is-open' : ''}`}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        aria-controls="primary-nav"
        onClick={toggleMenu}
      >
        <span className="nav-toggle-bar" />
        <span className="nav-toggle-bar" />
        <span className="nav-toggle-bar" />
      </button>

      <div
        id="primary-nav"
        className={`nav-actions ${menuOpen ? 'is-open' : ''}`}
      >
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="nav-link" onClick={closeMenu}>Dashboard</Link>
            <Link to="/tasks" className="nav-link" onClick={closeMenu}>Tasks</Link>
            <Link to="/calendar" className="nav-link" onClick={closeMenu}>Calendar</Link>
            <Link to="/groups" className="nav-link" onClick={closeMenu}>Groups</Link>
            <Link to="/chat" className="nav-link" onClick={closeMenu}>Chat</Link>
            <Link to="/categories" className="nav-link" onClick={closeMenu}>Categories</Link>
            <Link to="/profile" className="user-name nav-link" onClick={closeMenu}>{user.name}</Link>
            <button className="nav-ghost-btn" onClick={() => { closeMenu(); handleLogout(); }}>Logout</button>
          </>
        ) : (
          <>
            <button className="nav-ghost-btn" onClick={() => { closeMenu(); login(); }}>Log In</button>
            <button className="nav-primary-btn" onClick={() => { closeMenu(); signup(); }}>Sign Up</button>
          </>
        )}
      </div>

      {menuOpen && <button type="button" className="nav-backdrop" aria-hidden="true" onClick={closeMenu} tabIndex={-1} />}
    </nav>
  );
}

export default Navbar;

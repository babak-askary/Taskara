import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import logo from '../../assets/taskara-logo.png';

// SVG icons used by the bottom tab bar. Rendered inline so we avoid an icon
// font and can color them via currentColor for the active state.
function Icon({ name }) {
  const props = {
    viewBox: '0 0 24 24',
    width: 24,
    height: 24,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  switch (name) {
    case 'home':
      return <svg {...props}><path d="M3 11l9-8 9 8v10a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2z" /></svg>;
    case 'tasks':
      return <svg {...props}><path d="M9 11l3 3 8-8" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>;
    case 'calendar':
      return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18 M8 3v4 M16 3v4" /></svg>;
    case 'chat':
      return <svg {...props}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>;
    case 'more':
      return <svg {...props}><circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" /></svg>;
    case 'groups':
      return <svg {...props}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0" /><circle cx="17" cy="9" r="2.6" /><path d="M21.5 18a4.5 4.5 0 00-6-4.2" /></svg>;
    case 'tag':
      return <svg {...props}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><circle cx="7" cy="7" r="1.5" fill="currentColor" /></svg>;
    case 'profile':
      return <svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></svg>;
    case 'logout':
      return <svg {...props}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" /></svg>;
    default:
      return null;
  }
}

// Match a path against the current location considering nested routes —
// /tasks should be active on /tasks/123 too.
function isPathActive(path, pathname) {
  if (path === '/dashboard') return pathname === '/dashboard';
  return pathname === path || pathname.startsWith(path + '/');
}

function Navbar() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const [lastPath, setLastPath] = useState(location.pathname);

  // Close the More sheet whenever the route changes
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    if (moreOpen) setMoreOpen(false);
  }

  const login = () => loginWithRedirect();
  const signup = () => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });
  const handleLogout = () => logout({ logoutParams: { returnTo: window.location.origin } });

  const closeMore = () => setMoreOpen(false);

  // Lock body scroll while the More sheet is open
  useEffect(() => {
    if (!moreOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [moreOpen]);

  // Close on Escape
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMoreOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  // Five primary tabs shown on the mobile bottom bar. The 5th ("More") opens
  // a sheet with the secondary destinations.
  const tabs = isAuthenticated
    ? [
        { to: '/dashboard', label: 'Home', icon: 'home' },
        { to: '/tasks', label: 'Tasks', icon: 'tasks' },
        { to: '/calendar', label: 'Calendar', icon: 'calendar' },
        { to: '/chat', label: 'Chat', icon: 'chat' },
      ]
    : [];

  return (
    <>
      {/* Top bar — desktop only when signed in; full version for guests */}
      <nav className={`site-nav ${isAuthenticated ? 'site-nav-auth' : ''}`}>
        <Link to="/" className="brand-link">
          <img src={logo} alt="" className="brand-logo" aria-hidden="true" />
          <span className="brand-text">Taskara</span>
        </Link>

        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/tasks" className="nav-link">Tasks</Link>
              <Link to="/calendar" className="nav-link">Calendar</Link>
              <Link to="/groups" className="nav-link">Groups</Link>
              <Link to="/chat" className="nav-link">Chat</Link>
              <Link to="/categories" className="nav-link">Categories</Link>
              <Link to="/profile" className="user-name nav-link">{user.name}</Link>
              <button className="nav-ghost-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="nav-ghost-btn" onClick={login}>Log In</button>
              <button className="nav-primary-btn" onClick={signup}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      {/* Bottom tab bar — mobile only, signed-in only */}
      {isAuthenticated && (
        <nav className="tab-bar" role="tablist" aria-label="Primary navigation">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) => `tab-bar-btn ${isActive ? 'is-active' : ''}`}
              end={t.to === '/dashboard'}
            >
              <span className="tab-bar-icon"><Icon name={t.icon} /></span>
              <span className="tab-bar-label">{t.label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            className={`tab-bar-btn ${
              ['/groups', '/categories', '/profile'].some((p) => isPathActive(p, location.pathname))
                ? 'is-active'
                : ''
            }`}
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
          >
            <span className="tab-bar-icon"><Icon name="more" /></span>
            <span className="tab-bar-label">More</span>
          </button>
        </nav>
      )}

      {/* More sheet — secondary destinations + logout */}
      {moreOpen && (
        <div className="more-sheet-backdrop" onClick={closeMore}>
          <div
            className="more-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="More menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="more-sheet-grabber" aria-hidden="true" />
            <div className="more-sheet-user">
              <span className="more-sheet-avatar" aria-hidden="true">
                {user?.picture
                  ? <img src={user.picture} alt="" />
                  : <span>{(user?.name || user?.email || '?').charAt(0).toUpperCase()}</span>}
              </span>
              <div className="more-sheet-meta">
                <span className="more-sheet-name">{user?.name}</span>
                <span className="more-sheet-email">{user?.email}</span>
              </div>
            </div>

            <ul className="more-sheet-list">
              <li><Link to="/groups" className="more-sheet-item" onClick={closeMore}>
                <span className="more-sheet-item-icon"><Icon name="groups" /></span>
                <span>Groups</span>
              </Link></li>
              <li><Link to="/categories" className="more-sheet-item" onClick={closeMore}>
                <span className="more-sheet-item-icon"><Icon name="tag" /></span>
                <span>Categories</span>
              </Link></li>
              <li><Link to="/profile" className="more-sheet-item" onClick={closeMore}>
                <span className="more-sheet-item-icon"><Icon name="profile" /></span>
                <span>Profile</span>
              </Link></li>
            </ul>

            <button
              type="button"
              className="more-sheet-item more-sheet-logout"
              onClick={() => { closeMore(); handleLogout(); }}
            >
              <span className="more-sheet-item-icon"><Icon name="logout" /></span>
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;

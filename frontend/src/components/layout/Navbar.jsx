import { Link, NavLink } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { uiConfig } from '../../config/uiConfig';

function Navbar() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <nav className="nav-shell">
      <div>
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="brand-lockup">
          <span className="brand-badge" aria-hidden="true">T</span>
          <div>
            <p className="brand-name">{uiConfig.appName}</p>
          </div>
        </Link>
      </div>

      <div className="nav-links">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Tasks
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Profile
        </NavLink>
      </div>

      <div className="nav-actions">
        {isAuthenticated ? (
          <>
            <span className="user-chip">{user?.name || 'Member'}</span>
            <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <button className="btn btn-outline" onClick={() => loginWithRedirect()}>
              Login
            </button>
            <button
              className="btn btn-solid"
              onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

import { NavLink, useNavigate } from 'react-router-dom';
import { useAppAuth } from '../context/AuthContext.jsx';
import { useState } from 'react';

export function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAppAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <button className="navbar-brand" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}>
          <span className="brand-icon">✓</span>
          <span className="brand-name">TaskFlow</span>
        </button>

        {/* Desktop nav links */}
        {isAuthenticated && (
          <div className="navbar-links">
            <NavLink to="/dashboard" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              Dashboard
            </NavLink>
            <NavLink to="/tasks" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              Tasks
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              Profile
            </NavLink>
          </div>
        )}

        {/* User area */}
        <div className="navbar-user">
          {isAuthenticated && (
            <>
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">
                  {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
              )}
              <span className="user-display-name">{user?.name || user?.email}</span>
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                Sign Out
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        {isAuthenticated && (
          <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        )}
      </div>

      {/* Mobile drawer */}
      {menuOpen && isAuthenticated && (
        <div className="mobile-menu">
          <NavLink to="/dashboard" className="mobile-link" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
          <NavLink to="/tasks" className="mobile-link" onClick={() => setMenuOpen(false)}>Tasks</NavLink>
          <NavLink to="/profile" className="mobile-link" onClick={() => setMenuOpen(false)}>Profile</NavLink>
          <button className="btn btn-ghost" onClick={() => { logout(); setMenuOpen(false); }}>Sign Out</button>
        </div>
      )}
    </nav>
  );
}

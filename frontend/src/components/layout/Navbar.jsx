import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

function Navbar() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <nav className="site-nav">
      <Link to="/" className="brand-link">
        <span className="brand-icon">T</span>
        <span className="brand-text">Taskara</span>
      </Link>

      <div className="nav-actions">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/tasks" className="nav-link">Tasks</Link>
            <span className="user-name">{user.name}</span>
            <button className="nav-ghost-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <button className="nav-ghost-btn" onClick={() => loginWithRedirect()}>Log In</button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import logo from '../../assets/taskara-logo.png';

function Navbar() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

  const login = () => loginWithRedirect();
  const signup = () => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });
  const handleLogout = () => logout({ logoutParams: { returnTo: window.location.origin } });

  return (
    <nav className="site-nav">
      <Link to="/" className="brand-link">
        <img src={logo} alt="Taskara" className="brand-logo" />
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
          <>
            <button className="nav-ghost-btn" onClick={login}>Log In</button>
            <button className="nav-primary-btn" onClick={signup}>Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/global.css';

function Navbar() {
  const { isAuthenticated, user, loginWithRedirect, logout } = useAuth();

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Taskara
      </Link>
      <div className="navbar-links">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/tasks">Tasks</Link>
            <span>{user.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => loginWithRedirect()}>Login</button>
            <button onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}>
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

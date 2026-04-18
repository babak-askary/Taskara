import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';

function LoginPage() {
  const { isAuthenticated, isLoading, error, loginWithRedirect } = useAuth0();

  if (isAuthenticated) return <Navigate to="/dashboard" />;
  if (isLoading) return <p className="signin-provider">Loading...</p>;

  return (
    <div className="signin-screen">
      <p className="signin-overline">Taskara</p>
      <h1 className="signin-title">Sign in to continue</h1>
      <p className="signin-subtitle">Open your workspace.</p>

      {error && <p className="signin-provider">Error: {error.message}</p>}

      <div className="signin-actions">
        <button className="signin-primary-btn" onClick={() => loginWithRedirect()}>
          Log In
        </button>
        <button
          className="signin-link-btn"
          onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
        >
          Create Account
        </button>
      </div>

      <p className="signin-provider">Auth0</p>
    </div>
  );
}

export default LoginPage;

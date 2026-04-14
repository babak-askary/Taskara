import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';

function LoginPage() {
  const { isAuthenticated, isLoading, error, loginWithRedirect } = useAuth0();

  if (isAuthenticated) return <Navigate to="/dashboard" />;
  if (isLoading) return <p>Loading...</p>;

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Login to Taskara</h1>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      <button
        onClick={() => loginWithRedirect()}
        style={{ padding: '12px 30px', fontSize: '1rem', cursor: 'pointer', marginTop: '20px' }}
      >
        Log In
      </button>
    </div>
  );
}

export default LoginPage;

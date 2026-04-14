import { Navigate, Outlet } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

function AuthLoadingState() {
  return (
    <div className="auth-page-shell">
      <section className="auth-card card-surface">
        <p className="eyebrow">Taskara</p>
        <h1>Checking your session...</h1>
      </section>
    </div>
  );
}

export function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuth0();

  if (isLoading) {
    return <AuthLoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isLoading, isAuthenticated } = useAuth0();

  if (isLoading) {
    return <AuthLoadingState />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
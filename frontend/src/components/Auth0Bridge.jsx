// Bridges real Auth0 state into AppAuthContext.
// This component is ONLY rendered when Auth0 is configured (inside Auth0Provider).
import { useAuth0 } from '@auth0/auth0-react';
import { AppAuthContext } from '../context/AuthContext.jsx';

export function Auth0Bridge({ children }) {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0();

  return (
    <AppAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login: loginWithRedirect,
        logout: () => logout({ logoutParams: { returnTo: window.location.origin } }),
      }}
    >
      {children}
    </AppAuthContext.Provider>
  );
}

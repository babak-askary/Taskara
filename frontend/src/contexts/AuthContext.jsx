import { createContext, useContext } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0();

  const value = { isAuthenticated, isLoading, user, loginWithRedirect, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

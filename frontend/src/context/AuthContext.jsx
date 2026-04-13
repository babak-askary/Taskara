/* eslint-disable react-refresh/only-export-components */
// Context file: intentionally exports context, providers, and a custom hook.
import { createContext, useContext, useState } from 'react';

// Shared auth context — always available regardless of Auth0 configuration
export const AppAuthContext = createContext({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  login: () => {},
  logout: () => {},
});

const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@taskflow.app',
  picture: null,
  sub: 'demo|local',
};

// Demo provider — used when VITE_AUTH0_DOMAIN / VITE_AUTH0_CLIENT_ID are not set
export function DemoAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('tf_demo_auth') === '1',
  );

  const login = () => {
    localStorage.setItem('tf_demo_auth', '1');
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('tf_demo_auth');
    setIsAuthenticated(false);
  };

  return (
    <AppAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading: false,
        user: isAuthenticated ? DEMO_USER : null,
        login,
        logout,
      }}
    >
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  return useContext(AppAuthContext);
}

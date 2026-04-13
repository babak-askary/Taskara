import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { DemoAuthProvider } from './context/AuthContext.jsx';
import { Auth0Bridge } from './components/Auth0Bridge.jsx';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

// True when Auth0 credentials are present in .env
export const isAuth0Configured = !!(domain && clientId);

export function Auth0ProviderWithNavigate({ children }) {
  const navigate = useNavigate();

  // When Auth0 is not configured run in demo mode (no backend required)
  if (!isAuth0Configured) {
    return <DemoAuthProvider>{children}</DemoAuthProvider>;
  }

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo ?? window.location.pathname);
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        ...(audience ? { audience } : {}),
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {/* Bridge copies Auth0 state into our AppAuthContext */}
      <Auth0Bridge>{children}</Auth0Bridge>
    </Auth0Provider>
  );
}

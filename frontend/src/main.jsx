import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.jsx';
import { ToastProvider } from './hooks/useToast';
import ToastViewport from './components/common/Toast';
import './styles/global.css';

// Fail loudly at startup if the build is missing the env vars the app
// relies on, instead of throwing a useless white screen on first action.
const REQUIRED_ENV = ['VITE_AUTH0_DOMAIN', 'VITE_AUTH0_CLIENT_ID', 'VITE_API_URL'];
const missing = REQUIRED_ENV.filter((k) => !import.meta.env[k]);
if (missing.length) {
  const msg =
    `Taskara is missing required env vars: ${missing.join(', ')}.\n` +
    `Copy frontend/.env.example to frontend/.env, fill in the values, and rebuild.`;
  document.getElementById('root').innerHTML = `<pre style="padding:2rem;color:#b91c1c;font-family:monospace;white-space:pre-wrap;">${msg}</pre>`;
  throw new Error(msg);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      cacheLocation="localstorage"
      useRefreshTokens
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      }}
    >
      <BrowserRouter>
        <ToastProvider>
          <App />
          <ToastViewport />
        </ToastProvider>
      </BrowserRouter>
    </Auth0Provider>
  </StrictMode>
);

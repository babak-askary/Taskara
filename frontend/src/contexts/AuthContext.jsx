import { useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { setTokenGetter } from '../api/client';
import { login as syncUser } from '../api/authApi';
import { connectSocket, disconnectSocket } from '../services/socket';

// Connects Auth0 to the API client and syncs user to database on login.
export function AuthSetup() {
  const { getAccessTokenSilently, isAuthenticated, user } = useAuth0();
  const hasSynced = useRef(false);

  // getAccessTokenSilently is a fresh reference every render, which would
  // re-run any effect that depended on it (and bounce the socket on every
  // render). Capture it in a ref and read through that instead.
  const getTokenRef = useRef(getAccessTokenSilently);
  useEffect(() => { getTokenRef.current = getAccessTokenSilently; });

  // Set the token getter so axios can attach it to requests
  useEffect(() => {
    if (isAuthenticated) {
      setTokenGetter(() => getTokenRef.current());
    }
  }, [isAuthenticated]);

  // Sync Auth0 user to our database on first login
  useEffect(() => {
    if (isAuthenticated && user && !hasSynced.current) {
      hasSynced.current = true;
      syncUser({
        email: user.email,
        name: user.name || user.nickname || user.email,
        picture: user.picture,
      }).catch(() => {});
    }
  }, [isAuthenticated, user]);

  // Open / close the realtime socket alongside the auth session
  useEffect(() => {
    if (isAuthenticated) {
      connectSocket(() => getTokenRef.current());
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [isAuthenticated]);

  return null;
}

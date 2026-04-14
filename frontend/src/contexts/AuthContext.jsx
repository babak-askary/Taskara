import { useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { setTokenGetter } from '../api/client';
import { login as syncUser } from '../api/authApi';

// Connects Auth0 to the API client and syncs user to database on login.
export function AuthSetup() {
  const { getAccessTokenSilently, isAuthenticated, user } = useAuth0();
  const hasSynced = useRef(false);

  // Set the token getter so axios can attach it to requests
  useEffect(() => {
    if (isAuthenticated) {
      setTokenGetter(() => getAccessTokenSilently());
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  // Sync Auth0 user to our database on first login
  useEffect(() => {
    if (isAuthenticated && user && !hasSynced.current) {
      hasSynced.current = true;
      syncUser({
        email: user.email,
        name: user.name || user.nickname || user.email,
        picture: user.picture,
      }).catch((err) => console.error('User sync failed:', err));
    }
  }, [isAuthenticated, user]);

  return null;
}

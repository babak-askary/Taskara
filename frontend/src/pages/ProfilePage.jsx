import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
import { getProfile } from '../api/authApi';
import { updateProfile } from '../api/userApi';
import { errorMessage } from '../api/client';

function memberSince(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getProfile()
      .then((res) => {
        if (cancelled) return;
        setProfile(res.data);
        setName(res.data.name || '');
        setAvatarUrl(res.data.avatar_url || '');
      })
      .catch((err) => { if (!cancelled) setLoadError(errorMessage(err, 'Could not load profile.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  async function handleSave(e) {
    e.preventDefault();
    if (!profile || saving) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setSaveError('Name cannot be empty.');
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const res = await updateProfile(profile.id, {
        name: trimmedName,
        avatar_url: avatarUrl.trim() || null,
      });
      setProfile(res.data);
      setName(res.data.name || '');
      setAvatarUrl(res.data.avatar_url || '');
      setSavedAt(new Date());
    } catch (err) {
      setSaveError(errorMessage(err, 'Could not save profile.'));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <div className="loading">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="profile">
        <div className="dash-skel profile-skel" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="profile">
        <p className="dash-empty dash-error">{loadError}</p>
      </div>
    );
  }

  if (!profile) return null;

  const initial = (profile.name || profile.email || '?').charAt(0).toUpperCase();
  const dirty = name.trim() !== (profile.name || '') ||
    avatarUrl.trim() !== (profile.avatar_url || '');

  return (
    <div className="profile">
      <header className="profile-header">
        <p className="tasks-eyebrow">Account</p>
        <h1 className="tasks-title">Your profile</h1>
        <p className="tasks-count">
          Member since {memberSince(profile.created_at)}
        </p>
      </header>

      <div className="profile-grid">
        <aside className="profile-side">
          <div className="profile-avatar" aria-hidden="true">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <p className="profile-display-name">{profile.name || 'Unnamed'}</p>
          <p className="profile-display-email">{profile.email}</p>
        </aside>

        <form className="profile-form td-card" onSubmit={handleSave}>
          <h3 className="td-card-title">Edit profile</h3>

          <div className="td-field">
            <label className="td-label" htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              type="text"
              className="td-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              autoComplete="name"
            />
          </div>

          <div className="td-field">
            <label className="td-label" htmlFor="profile-avatar">Avatar URL</label>
            <input
              id="profile-avatar"
              type="url"
              className="td-input"
              placeholder="https://…"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              autoComplete="photo"
            />
            <p className="td-hint">Paste a public image URL — leave blank for the letter avatar.</p>
          </div>

          <div className="td-field-display">
            <span className="td-label">Email</span>
            <span className="td-display-value">{profile.email}</span>
          </div>

          {saveError && <p className="dash-error profile-error">{saveError}</p>}

          <div className="profile-actions">
            <button
              type="submit"
              className="nav-primary-btn profile-save"
              disabled={!dirty || saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {savedAt && !dirty && !saving && (
              <span className="profile-saved">Saved.</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;

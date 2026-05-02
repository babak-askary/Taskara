import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const DEFAULT_SETTINGS = {
  displayName: '',
  bio: '',
  role: 'Individual contributor',
  timezone: 'Pacific Time (PT)',
};

function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth0();
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!user) return;

    setForm((current) => ({
      ...current,
      displayName: user.name || user.nickname || user.email || '',
      bio:
        current.bio ||
        'Keep your profile details current so collaboration and sharing stay clear.',
    }));
  }, [user]);

  const email = user?.email || 'Not available';
  const name = form.displayName || user?.name || user?.nickname || 'Your profile';
  const initials = useMemo(() => getInitials(name), [name]);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
    setStatus('');
  };

  const handleSave = (event) => {
    event.preventDefault();
    setStatus('Profile saved.');
  };

  const handleSignOut = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  if (isLoading) return <div className="loading">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="td">
      <div className="td-back">
        <Link to="/dashboard" className="dash-link">
          ← Back to dashboard
        </Link>
      </div>

      <header className="td-header">
        <p className="dash-date">Account</p>
        <h1 className="dash-greeting">Profile</h1>
        <p className="dash-subtitle">Manage your details and preferences in one place.</p>
      </header>

      <div className="td-grid">
        <div className="td-col-main">
          <section className="td-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                aria-hidden="true"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '18px',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  color: '#fff',
                  background: 'linear-gradient(135deg, #0a84ff, #bf5af2)',
                  boxShadow: '0 8px 24px rgba(10, 132, 255, 0.25)',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>

              <div style={{ minWidth: 0 }}>
                <h2 className="td-card-title" style={{ marginBottom: '6px' }}>
                  {name}
                </h2>
                <p className="dash-subtitle" style={{ lineHeight: 1.5 }}>
                  {form.bio}
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '14px',
                marginTop: '18px',
              }}
            >
              <div className="td-field" style={{ marginBottom: 0 }}>
                <span className="td-label">Email</span>
                <div className="td-field-display" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                  <span className="td-display-value">{email}</span>
                </div>
              </div>
              <div className="td-field" style={{ marginBottom: 0 }}>
                <span className="td-label">Role</span>
                <div className="td-field-display" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                  <span className="td-display-value">{form.role}</span>
                </div>
              </div>
              <div className="td-field" style={{ marginBottom: 0 }}>
                <span className="td-label">Time zone</span>
                <div className="td-field-display" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                  <span className="td-display-value">{form.timezone}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="td-card">
            <h2 className="td-card-title">Edit profile</h2>

            <form onSubmit={handleSave}>
              <div className="td-field">
                <label className="td-label" htmlFor="displayName">
                  Display name
                </label>
                <input
                  id="displayName"
                  className="td-input"
                  value={form.displayName}
                  onChange={handleChange('displayName')}
                  placeholder="Enter your display name"
                />
              </div>

              <div className="td-field">
                <label className="td-label" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  className="td-desc-input"
                  value={form.bio}
                  onChange={handleChange('bio')}
                  placeholder="Write a short summary about yourself"
                  style={{ minHeight: '110px' }}
                />
              </div>

              <div className="td-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '4px' }}>
                <div className="td-field" style={{ marginBottom: 0 }}>
                  <label className="td-label" htmlFor="role">
                    Role
                  </label>
                  <select
                    id="role"
                    className="td-select"
                    value={form.role}
                    onChange={handleChange('role')}
                  >
                    <option>Individual contributor</option>
                    <option>Team lead</option>
                    <option>Project manager</option>
                    <option>Student</option>
                  </select>
                </div>

                <div className="td-field" style={{ marginBottom: 0 }}>
                  <label className="td-label" htmlFor="timezone">
                    Time zone
                  </label>
                  <select
                    id="timezone"
                    className="td-select"
                    value={form.timezone}
                    onChange={handleChange('timezone')}
                  >
                    <option>Pacific Time (PT)</option>
                    <option>Mountain Time (MT)</option>
                    <option>Central Time (CT)</option>
                    <option>Eastern Time (ET)</option>
                    <option>UTC</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
                <button className="td-comment-btn" type="submit">
                  Save changes
                </button>
                <button className="nav-ghost-btn" type="button" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside className="td-col-side">
          <section className="td-card">
            <h2 className="td-card-title">Account summary</h2>
            <div className="td-field">
              <span className="td-label">Signed in as</span>
              <div className="td-display-value">{email}</div>
            </div>
            <div className="td-field">
              <span className="td-label">Name on profile</span>
              <div className="td-display-value">{name}</div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default ProfilePage;
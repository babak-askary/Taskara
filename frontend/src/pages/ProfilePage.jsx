import { useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const DEFAULT_SETTINGS = {
  displayName: '',
  bio: '',
  role: 'Individual contributor',
  timezone: 'Pacific Time (PT)',
  notifications: true,
  weeklySummary: true,
  theme: 'System',
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
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
  } = useAuth0();

  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!user) return;

    setForm((current) => ({
      ...current,
      displayName: user.name || user.nickname || user.email || '',
      bio: current.bio || 'Keep personal notes, preferences, and task details in one place.',
    }));
  }, [user]);

  const email = user?.email || 'Not available';
  const name = form.displayName || user?.name || user?.nickname || 'Your profile';
  const initials = useMemo(() => getInitials(name), [name]);

  const handleChange = (field) => (event) => {
    const { type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [field]: type === 'checkbox' ? checked : value,
    }));
    setStatus('');
  };

  const handleSave = (event) => {
    event.preventDefault();
    setStatus('Profile settings saved locally. Connect this screen to the user update API next.');
  };

  const handleSignOut = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  if (isLoading) {
    return (
      <div className="profile-page profile-page--loading">
        <div className="profile-card">
          <p className="profile-kicker">Profile</p>
          <h1>Loading account details...</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="profile-page profile-page--empty">
        <div className="profile-card profile-card--empty">
          <p className="profile-kicker">Profile</p>
          <h1>Sign in to manage your profile</h1>
          <p>
            Once you log in, you can update your display name, preferences, and
            account settings from one place.
          </p>
          <button
            className="profile-btn profile-btn--primary"
            onClick={() => loginWithRedirect()}
          >
            Log In
          </button>
        </div>

        <style>{`
          .profile-page {
            min-height: calc(100vh - 64px);
            padding: 32px 20px 48px;
            background:
              radial-gradient(circle at top left, rgba(10, 132, 255, 0.18), transparent 28%),
              radial-gradient(circle at top right, rgba(255, 87, 34, 0.16), transparent 24%),
              linear-gradient(180deg, #070709 0%, #0b0b0e 100%);
            color: #f5f5f7;
          }

          .profile-page--loading,
          .profile-page--empty {
            display: grid;
            place-items: center;
          }

          .profile-grid {
            max-width: 1180px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
            gap: 22px;
          }

          .profile-card {
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 28px;
            background: rgba(12, 12, 16, 0.78);
            backdrop-filter: blur(20px);
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
          }

          .profile-card--empty,
          .profile-card--hero,
          .profile-card--form,
          .profile-card--side {
            padding: 24px;
          }

          .profile-kicker {
            margin-bottom: 10px;
            color: #8f9bb3;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            font-size: 0.74rem;
          }

          .profile-hero {
            display: flex;
            align-items: center;
            gap: 18px;
          }

          .profile-avatar {
            width: 72px;
            height: 72px;
            border-radius: 22px;
            display: grid;
            place-items: center;
            font-size: 1.35rem;
            font-weight: 700;
            letter-spacing: -0.04em;
            color: #fff;
            background: linear-gradient(135deg, #0a84ff 0%, #30d158 100%);
            box-shadow: 0 18px 40px rgba(10, 132, 255, 0.28);
          }

          .profile-title {
            font-size: clamp(1.8rem, 3vw, 2.5rem);
            line-height: 1.05;
            letter-spacing: -0.04em;
            margin-bottom: 10px;
          }

          .profile-subtitle {
            color: #a1a1a6;
            line-height: 1.55;
            max-width: 56ch;
          }

          .profile-meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-top: 22px;
          }

          .profile-stat {
            padding: 16px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.06);
          }

          .profile-stat-value {
            display: block;
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 4px;
          }

          .profile-stat-label {
            color: #a1a1a6;
            font-size: 0.88rem;
          }

          .profile-form {
            display: grid;
            gap: 22px;
          }

          .profile-section-title {
            font-size: 1.05rem;
            margin-bottom: 6px;
            letter-spacing: -0.02em;
          }

          .profile-section-copy {
            color: #a1a1a6;
            line-height: 1.55;
          }

          .profile-fields {
            display: grid;
            gap: 14px;
            margin-top: 18px;
          }

          .profile-field {
            display: grid;
            gap: 8px;
          }

          .profile-field label {
            font-size: 0.9rem;
            color: #cfcfd5;
            font-weight: 500;
          }

          .profile-field input,
          .profile-field select,
          .profile-field textarea {
            width: 100%;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.04);
            color: #f5f5f7;
            padding: 14px 16px;
            font: inherit;
            outline: none;
            transition: border-color 0.15s ease, background 0.15s ease;
          }

          .profile-field textarea {
            min-height: 110px;
            resize: vertical;
          }

          .profile-field input:focus,
          .profile-field select:focus,
          .profile-field textarea:focus {
            border-color: rgba(10, 132, 255, 0.8);
            background: rgba(255, 255, 255, 0.06);
          }

          .profile-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
          }

          .profile-toggle:first-child {
            border-top: none;
            padding-top: 0;
          }

          .profile-toggle-copy strong {
            display: block;
            margin-bottom: 4px;
          }

          .profile-toggle-copy span {
            color: #a1a1a6;
            line-height: 1.45;
            font-size: 0.92rem;
          }

          .profile-switch {
            width: 46px;
            height: 28px;
            accent-color: #0a84ff;
          }

          .profile-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 6px;
          }

          .profile-btn {
            border-radius: 999px;
            padding: 12px 18px;
            font-weight: 600;
            border: 1px solid transparent;
            transition: transform 0.12s ease, background 0.15s ease, border-color 0.15s ease;
          }

          .profile-btn:active {
            transform: scale(0.98);
          }

          .profile-btn--primary {
            background: #0a84ff;
            color: #fff;
          }

          .profile-btn--primary:hover {
            background: #409cff;
          }

          .profile-btn--secondary {
            background: transparent;
            color: #f5f5f7;
            border-color: rgba(255, 255, 255, 0.12);
          }

          .profile-btn--secondary:hover {
            border-color: rgba(255, 255, 255, 0.22);
            background: rgba(255, 255, 255, 0.05);
          }

          .profile-note {
            color: #8f9bb3;
            font-size: 0.9rem;
            line-height: 1.55;
          }

          .profile-status {
            margin-top: 14px;
            color: #30d158;
            font-size: 0.92rem;
            line-height: 1.45;
          }

          @media (max-width: 900px) {
            .profile-grid {
              grid-template-columns: 1fr;
            }

            .profile-meta {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 640px) {
            .profile-page {
              padding: 20px 14px 32px;
            }

            .profile-card--hero,
            .profile-card--form,
            .profile-card--side,
            .profile-card--empty {
              padding: 20px;
            }

            .profile-hero {
              align-items: flex-start;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-grid">
        <section className="profile-card profile-card--hero">
          <p className="profile-kicker">Profile</p>
          <div className="profile-hero">
            <div className="profile-avatar" aria-hidden="true">
              {initials}
            </div>
            <div>
              <h1 className="profile-title">{name}</h1>
              <p className="profile-subtitle">{form.bio}</p>
            </div>
          </div>

          <div className="profile-meta">
            <div className="profile-stat">
              <span className="profile-stat-value">{email}</span>
              <span className="profile-stat-label">Email address</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{form.role}</span>
              <span className="profile-stat-label">Default workspace role</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{form.timezone}</span>
              <span className="profile-stat-label">Time zone</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">{form.theme}</span>
              <span className="profile-stat-label">Appearance preference</span>
            </div>
          </div>

          <p className="profile-note" style={{ marginTop: '20px' }}>
            This page is the first pass for profile management. It is ready to
            connect to a user update endpoint once the backend route is in
            place.
          </p>
        </section>

        <section className="profile-card profile-card--form">
          <form className="profile-form" onSubmit={handleSave}>
            <div>
              <p className="profile-kicker">Account details</p>
              <h2 className="profile-section-title">Edit your profile</h2>
              <p className="profile-section-copy">
                Update the identity and preferences that should follow you across
                the app.
              </p>
            </div>

            <div className="profile-fields">
              <div className="profile-field">
                <label htmlFor="displayName">Display name</label>
                <input
                  id="displayName"
                  value={form.displayName}
                  onChange={handleChange('displayName')}
                  placeholder="Enter your display name"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={form.bio}
                  onChange={handleChange('bio')}
                  placeholder="Write a short summary about yourself"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="role">Role</label>
                <select id="role" value={form.role} onChange={handleChange('role')}>
                  <option>Individual contributor</option>
                  <option>Team lead</option>
                  <option>Project manager</option>
                  <option>Student</option>
                </select>
              </div>

              <div className="profile-field">
                <label htmlFor="timezone">Time zone</label>
                <select
                  id="timezone"
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

              <div className="profile-field">
                <label htmlFor="theme">Theme</label>
                <select id="theme" value={form.theme} onChange={handleChange('theme')}>
                  <option>System</option>
                  <option>Light</option>
                  <option>Dark</option>
                </select>
              </div>
            </div>

            <div>
              <p className="profile-kicker">Preferences</p>
              <div className="profile-toggle">
                <div className="profile-toggle-copy">
                  <strong>Task notifications</strong>
                  <span>Receive alerts for due dates, mentions, and shared updates.</span>
                </div>
                <input
                  className="profile-switch"
                  type="checkbox"
                  checked={form.notifications}
                  onChange={handleChange('notifications')}
                  aria-label="Task notifications"
                />
              </div>

              <div className="profile-toggle">
                <div className="profile-toggle-copy">
                  <strong>Weekly summary</strong>
                  <span>Get a quick progress snapshot at the end of each week.</span>
                </div>
                <input
                  className="profile-switch"
                  type="checkbox"
                  checked={form.weeklySummary}
                  onChange={handleChange('weeklySummary')}
                  aria-label="Weekly summary"
                />
              </div>
            </div>

            <div className="profile-actions">
              <button className="profile-btn profile-btn--primary" type="submit">
                Save Changes
              </button>
              <button
                className="profile-btn profile-btn--secondary"
                type="button"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>

            {status ? <p className="profile-status">{status}</p> : null}
          </form>
        </section>
      </div>
    </div>
  );
}

export default ProfilePage;
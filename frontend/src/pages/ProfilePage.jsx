import { useAuth0 } from '@auth0/auth0-react';

function ProfilePage() {
  const { user } = useAuth0();

  return (
    <section className="profile-page fade-up">
      <header className="page-head">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
        </div>
      </header>

      <article className="card-surface profile-card">
        <div className="profile-top">
          {user?.picture ? (
            <img className="profile-avatar" src={user.picture} alt={user?.name || 'User avatar'} />
          ) : (
            <div className="profile-avatar profile-avatar-fallback" aria-hidden="true">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h2>{user?.name || 'Member'}</h2>
            <p className="lead">{user?.email || 'No email available'}</p>
          </div>
        </div>

        <div className="profile-grid">
          <div>
            <p className="eyebrow">User ID</p>
            <p>{user?.sub || 'Not available'}</p>
          </div>
          <div>
            <p className="eyebrow">Email verified</p>
            <p>{user?.email_verified ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="eyebrow">Updated at</p>
            <p>{user?.updated_at ? new Date(user.updated_at).toLocaleString() : 'Not available'}</p>
          </div>
        </div>
      </article>
    </section>
  );
}

export default ProfilePage;

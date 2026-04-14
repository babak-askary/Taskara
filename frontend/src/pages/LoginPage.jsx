import { useAuth0 } from '@auth0/auth0-react';
import { uiConfig, uiText } from '../config/uiConfig';

function LoginPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <main className="auth-page-shell fade-up">
      <section className="auth-layout">
        <article className="card-surface auth-info-panel">
          <p className="eyebrow">{uiText.login.workspaceEyebrow}</p>
          <h2>{uiText.login.workspaceTitle}</h2>
          <p className="lead">{uiText.login.workspaceSubtitle}</p>

          <div className="auth-info-points">
            {uiText.login.quickPoints.map((point) => (
              <p key={point}>{point}</p>
            ))}
          </div>

          <div className="auth-stat-grid">
            {uiText.login.stats.map((stat) => (
              <div key={stat.label} className="auth-stat-item">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </article>

        <section className="auth-card auth-card-expanded card-surface">
          <p className="eyebrow">{uiText.login.secureAccessEyebrow}</p>
          <h1>{uiConfig.appName}</h1>
          <p className="lead">{uiText.login.secureAccessSubtitle}</p>

          <div className="auth-point-row">
            {uiText.login.quickPoints.map((point) => (
              <span key={point} className="auth-point-chip">{point}</span>
            ))}
          </div>

          <div className="auth-action-row">
            <button className="btn btn-solid" onClick={() => loginWithRedirect()}>
              {uiConfig.loginButtonLabel}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
            >
              {uiConfig.signupButtonLabel}
            </button>
          </div>

          <div className="auth-security-row">
            {uiText.login.securityBadges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>

          <p className="auth-footnote">{uiText.login.footnote}</p>
        </section>
      </section>
    </main>
  );
}

export default LoginPage;

import { useAuth0 } from '@auth0/auth0-react';
import { uiConfig, uiText } from '../config/uiConfig';

function HomePage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <main className="landing-page fade-up">
      <header className="public-home-nav card-surface">
        <div className="brand-lockup">
          <span className="brand-badge" aria-hidden="true">T</span>
          <div>
            <p className="brand-name">{uiConfig.appName}</p>
          </div>
        </div>

        <button className="btn btn-outline" onClick={() => loginWithRedirect()}>
          {uiConfig.loginButtonLabel}
        </button>
      </header>

      <section className="landing-hero">
        <p className="hero-badge">{uiText.home.badge}</p>
        <h1>{uiText.home.title}</h1>
        <p className="hero-copy-text">{uiText.home.subtitle}</p>

        <div className="hero-cta-row hero-cta-row-centered">
          <button className="btn btn-solid btn-large" onClick={() => loginWithRedirect()}>
            {uiConfig.loginButtonLabel}
          </button>
          <button
            className="btn btn-text"
            onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
          >
            {uiConfig.signupButtonLabel}
          </button>
        </div>

        <p className="hero-fineprint">{uiText.home.authProvider}</p>
      </section>
    </main>
  );
}

export default HomePage;

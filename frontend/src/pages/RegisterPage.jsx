import { useAuth0 } from '@auth0/auth0-react';
import { uiConfig, uiText } from '../config/uiConfig';

function RegisterPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <main className="auth-page-shell fade-up">
      <section className="auth-card card-surface">
        <p className="eyebrow">{uiText.register.eyebrow}</p>
        <h1>Join {uiConfig.appName}</h1>
        <p className="lead">{uiText.register.subtitle}</p>
        <button
          className="btn btn-solid"
          onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
        >
          {uiConfig.signupButtonLabel}
        </button>
      </section>
    </main>
  );
}

export default RegisterPage;

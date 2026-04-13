import { useAppAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '✅', title: 'Task Management', desc: 'Create, edit, and organize tasks with categories, priorities, and deadlines.' },
  { icon: '📊', title: 'Progress Dashboard', desc: 'Visualize your productivity with real-time charts and completion stats.' },
  { icon: '💬', title: 'Comments & Files', desc: 'Collaborate with teammates — comment on tasks and attach files.' },
  { icon: '🔁', title: 'Recurring Tasks', desc: 'Set up daily, weekly, or monthly recurring tasks automatically.' },
  { icon: '✨', title: 'AI Assistant', desc: 'Smart suggestions for task descriptions, priority, and deadlines.' },
  { icon: '🔍', title: 'Search & Filter', desc: 'Find any task instantly with powerful filters and full-text search.' },
];

export function LandingPage() {
  const { isAuthenticated, login } = useAppAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">✦ Task Management Platform</div>
        <h1 className="hero-title">
          Get More Done,<br />
          <span className="hero-accent">Stay Organized</span>
        </h1>
        <p className="hero-subtitle">
          TaskFlow helps you manage tasks, track progress, and collaborate with your team — all in one place.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={login}>
            Get Started Free
          </button>
          <button className="btn btn-ghost btn-lg" onClick={login}>
            Sign In
          </button>
        </div>
        <p className="hero-note">Free to use · No credit card required · Auth0 secured</p>
      </section>

      {/* Features grid */}
      <section className="features-section">
        <h2 className="section-heading">Everything you need to stay productive</h2>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="cta-section">
        <h2>Ready to boost your productivity?</h2>
        <button className="btn btn-primary btn-lg" onClick={login}>
          Start for Free →
        </button>
      </section>
    </div>
  );
}

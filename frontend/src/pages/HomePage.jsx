import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

const TYPED_PHRASES = [
  'Organize anything.',
  'Plan your week.',
  'Share with anyone.',
  'Never miss a deadline.',
  'Stay in sync.',
  'Get things done.',
];

function useTypewriter(phrases, { typeSpeed = 65, deleteSpeed = 35, pause = 1400 } = {}) {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState('typing');

  useEffect(() => {
    const current = phrases[index % phrases.length];
    let t;
    if (mode === 'typing') {
      if (text.length < current.length) {
        t = setTimeout(() => setText(current.slice(0, text.length + 1)), typeSpeed);
      } else {
        t = setTimeout(() => setMode('deleting'), pause);
      }
    } else {
      if (text.length > 0) {
        t = setTimeout(() => setText(current.slice(0, text.length - 1)), deleteSpeed);
      } else {
        setIndex((i) => i + 1);
        setMode('typing');
      }
    }
    return () => clearTimeout(t);
  }, [text, mode, index, phrases, typeSpeed, deleteSpeed, pause]);

  return text;
}

function HomePage() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const typed = useTypewriter(TYPED_PHRASES);

  const maskSectionRef = useRef(null);
  const maskGroupRef = useRef(null);
  const maskSubRef = useRef(null);
  const maskHintRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated || isLoading) return;

    let frame = 0;

    const update = () => {
      const section = maskSectionRef.current;
      const group = maskGroupRef.current;
      const sub = maskSubRef.current;
      const hint = maskHintRef.current;
      if (!section || !group) return;

      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));

      // Phase 1: mask word scales from 6 -> 1 across 0..0.65
      const maskP = Math.min(1, p / 0.65);
      const scale = 6 - maskP * 5;
      group.setAttribute(
        'transform',
        `translate(800 470) scale(${scale.toFixed(4)}) translate(-800 -470)`
      );

      // Phase 2: subtitle fades in across 0.55..0.95
      if (sub) {
        const rP = Math.min(1, Math.max(0, (p - 0.55) / 0.4));
        sub.style.opacity = rP;
        sub.style.transform = `translate(-50%, ${(1 - rP) * 20}px)`;
      }

      // Scroll hint visible only briefly when entering the section
      if (hint) hint.style.opacity = Math.max(0, 1 - p * 5);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (isAuthenticated || isLoading) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isAuthenticated, isLoading]);

  if (isLoading) return <div className="loading">Loading...</div>;
  if (isAuthenticated) return <Navigate to="/tasks" replace />;

  const signup = () =>
    loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });
  const login = () => loginWithRedirect();

  return (
    <div className="landing">
      {/* 1 — Hero: Taskara + typewriter + summary + CTAs + scroll hint */}
      <section className="hero">
        <p className="hero-brand">Taskara</p>
        <p className="hero-typed" aria-live="polite">
          <span className="typed-text">{typed}</span>
          <span className="caret" aria-hidden="true" />
        </p>
        <p className="hero-lede">
          One workspace for everything you've got going on. Plan, share, and
          stay on top of what matters — at work, at home, at school, or anywhere
          in between.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={signup}>
            Join Now
          </button>
          <button className="btn-secondary" onClick={login}>
            Log In
          </button>
        </div>
        <p className="hero-note">No credit card required · Free forever plan</p>
        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="scroll-arrow" />
        </div>
      </section>

      {/* 2 — Statement */}
      <section className="statement">
        <div className="statement-inner reveal">
          <p className="eyebrow">Built for everyone</p>
          <h2 className="statement-text">
            Plan, track, and finish what matters{' '}
            <span className="statement-accent">without the clutter.</span>
          </h2>
        </div>
      </section>

      {/* 3 — Bento feature tiles */}
      <section className="bento">
        <article className="tile tile-tasks reveal">
          <div className="tile-glow" aria-hidden="true" />
          <div className="tile-copy">
            <p className="tile-eyebrow">Everything in one place</p>
            <h3 className="tile-title">All your tasks, beautifully clear.</h3>
            <p className="tile-text">
              Deadlines, lists, and reminders — organized automatically. See
              what matters today without a single click.
            </p>
          </div>
          <div className="tile-visual vis-tasks">
            <div className="vis-header">
              <span className="vis-label">Today</span>
              <span className="vis-count">4 tasks</span>
            </div>
            <div className="vrow vrow-done">
              <span className="vcheck vcheck-done" aria-hidden="true" />
              <span className="vname">Morning workout</span>
              <span className="vbadge vbadge-mute">7:00 AM</span>
            </div>
            <div className="vrow">
              <span className="vcheck" aria-hidden="true" />
              <span className="vname">Submit report</span>
              <span className="vbadge vbadge-red">High</span>
            </div>
            <div className="vrow">
              <span className="vcheck" aria-hidden="true" />
              <span className="vname">Grocery shopping</span>
              <span className="vbadge">2:00 PM</span>
            </div>
            <div className="vrow">
              <span className="vcheck" aria-hidden="true" />
              <span className="vname">Plan weekend trip</span>
              <span className="vbadge">This week</span>
            </div>
          </div>
        </article>

        <article className="tile tile-sync reveal">
          <div className="tile-glow" aria-hidden="true" />
          <div className="tile-copy">
            <p className="tile-eyebrow">In perfect sync</p>
            <h3 className="tile-title">Change it once. Everyone sees it.</h3>
            <p className="tile-text">
              Updates land instantly across every device. Your family, class, or
              team stays on the exact same page — no refresh required.
            </p>
          </div>
          <div className="tile-visual vis-sync">
            <span className="orbit orbit-1" />
            <span className="orbit orbit-2" />
            <span className="orbit orbit-3" />
            <span className="core" />
            <span className="sync-dot sync-dot-1">B</span>
            <span className="sync-dot sync-dot-2">R</span>
            <span className="sync-dot sync-dot-3">K</span>
          </div>
        </article>

        <article className="tile tile-wide tile-chart reveal">
          <div className="tile-glow" aria-hidden="true" />
          <div className="tile-copy">
            <p className="tile-eyebrow">The full picture</p>
            <h3 className="tile-title">See your progress, always.</h3>
            <p className="tile-text">
              A live view of what's late, what's next, and what's done — so you
              never have to ask. Turn to Taskara and the answer's right there.
            </p>
          </div>
          <div className="tile-visual vis-chart">
            <div className="chart-header">
              <div>
                <p className="chart-kicker">This week</p>
                <p className="chart-value">
                  +34%<span className="chart-unit"> done</span>
                </p>
              </div>
              <div className="chart-legend">
                <span><span className="leg-dot leg-dot-done" /> Completed</span>
                <span><span className="leg-dot leg-dot-due" /> Pending</span>
              </div>
            </div>
            <div className="chart-bars">
              <div className="bar-col"><div className="bar" style={{ '--h': '35%', '--d': '0s' }} /></div>
              <div className="bar-col"><div className="bar" style={{ '--h': '62%', '--d': '.05s' }} /></div>
              <div className="bar-col"><div className="bar" style={{ '--h': '48%', '--d': '.1s' }} /></div>
              <div className="bar-col"><div className="bar" style={{ '--h': '80%', '--d': '.15s' }} /></div>
              <div className="bar-col"><div className="bar" style={{ '--h': '55%', '--d': '.2s' }} /></div>
              <div className="bar-col"><div className="bar" style={{ '--h': '92%', '--d': '.25s' }} /></div>
              <div className="bar-col"><div className="bar" style={{ '--h': '70%', '--d': '.3s' }} /></div>
            </div>
            <div className="chart-axis">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </article>

        <article className="tile tile-secure reveal">
          <div className="tile-glow" aria-hidden="true" />
          <div className="tile-copy">
            <p className="tile-eyebrow">Private by design</p>
            <h3 className="tile-title">Your tasks, yours alone.</h3>
            <p className="tile-text">
              Encrypted storage and trusted sign-in mean only the people you
              invite ever see your plans. That's it.
            </p>
          </div>
          <div className="tile-visual vis-shield">
            <div className="shield-ring" aria-hidden="true" />
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <path
                d="M60 8 L108 26 L108 62 Q108 96 60 112 Q12 96 12 62 L12 26 Z"
                fill="none"
                stroke="url(#shieldStroke)"
                strokeWidth="3"
              />
              <path d="M42 62 L56 76 L82 48" fill="none" stroke="#30d158" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="shieldStroke" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0a84ff" />
                  <stop offset="100%" stopColor="#bf5af2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </article>

        <article className="tile tile-share reveal">
          <div className="tile-glow" aria-hidden="true" />
          <div className="tile-copy">
            <p className="tile-eyebrow">Share the load</p>
            <h3 className="tile-title">Invite anyone in a tap.</h3>
            <p className="tile-text">
              Family, classmates, friends, or co-workers. Add them by name,
              choose their access, and you're collaborating.
            </p>
          </div>
          <div className="tile-visual vis-share">
            <div className="share-card">
              <span className="share-card-dot" />
              <span className="share-card-text">Weekend trip planning</span>
              <span className="share-card-tag">Shared</span>
            </div>
            <div className="avatars">
              <span className="av av1">BA</span>
              <span className="av av2">RS</span>
              <span className="av av3">KT</span>
              <span className="av av4">+12</span>
            </div>
          </div>
        </article>
      </section>

      {/* 4 — Scroll-mask reveal (mid-page wow moment) */}
      <section className="mask-hero" ref={maskSectionRef}>
        <div className="mask-stage">
          <div className="mask-bg" aria-hidden="true" />
          <div className="mask-bg mask-bg-b" aria-hidden="true" />

          <svg
            className="mask-svg"
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <mask id="together-hole" maskUnits="userSpaceOnUse">
                <rect x="0" y="0" width="1600" height="900" fill="white" />
                <g ref={maskGroupRef}>
                  <text
                    x="800"
                    y="470"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="black"
                    className="mask-word"
                  >
                    Together.
                  </text>
                </g>
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="1600"
              height="900"
              fill="#000"
              mask="url(#together-hole)"
            />
          </svg>

          <div className="mask-sub" ref={maskSubRef}>
            <p className="eyebrow">Better together</p>
            <p className="mask-subtitle">
              Share tasks, stay in sync, and move forward with the people who matter.
            </p>
          </div>

          <div className="scroll-hint" ref={maskHintRef}>
            <span>Scroll</span>
            <div className="scroll-arrow" />
          </div>
        </div>
      </section>

      {/* 4.5 — Simplicity pitch */}
      <section className="statement">
        <div className="statement-inner reveal">
          <p className="eyebrow">Simple by design</p>
          <h2 className="statement-text">
            Managing tasks has{' '}
            <span className="statement-accent">never been this simple.</span>
          </h2>
        </div>
      </section>

      {/* 4.6 — Ease cards (with AI highlight) */}
      <section className="ease">
        <div className="ease-inner reveal">
          <h2 className="ease-heading">Everything hard, made easy.</h2>
          <p className="ease-text">
            We built Taskara so the boring parts get out of your way — signing in,
            creating tasks, managing them, sharing with people, and keeping your
            team in sync. And with built-in AI features helping along, even the
            smart stuff happens in seconds.
          </p>
        </div>

        <div className="ease-grid">
          <div className="ease-card reveal">
            <div className="ease-icon ease-icon-key">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="8" cy="12" r="4" />
                <path d="M12 12h10 M18 12v4 M21 12v3" />
              </svg>
            </div>
            <h3 className="ease-title">One-tap sign-in</h3>
            <p className="ease-desc">
              Log in securely in a single click. No long forms, no passwords to remember.
            </p>
          </div>

          <div className="ease-card reveal">
            <div className="ease-icon ease-icon-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="5" width="16" height="14" rx="3" />
                <path d="M8 12l3 3 5-6" />
              </svg>
            </div>
            <h3 className="ease-title">Tasks in seconds</h3>
            <p className="ease-desc">
              Type what you need. Set a deadline, pick a list, and you're done — no fiddly setup.
            </p>
          </div>

          <div className="ease-card reveal">
            <div className="ease-icon ease-icon-share">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="6" cy="12" r="2.5" />
                <circle cx="18" cy="6" r="2.5" />
                <circle cx="18" cy="18" r="2.5" />
                <path d="M8.2 11l7.8-4 M8.2 13l7.8 4" />
              </svg>
            </div>
            <h3 className="ease-title">Share with anyone</h3>
            <p className="ease-desc">
              Invite family, friends, or co-workers to a task or a whole list. They're in, instantly.
            </p>
          </div>

          <div className="ease-card reveal">
            <div className="ease-icon ease-icon-ai">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v2 M12 19v2 M5 12H3 M21 12h-2 M6 6l1.4 1.4 M16.6 16.6L18 18 M6 18l1.4-1.4 M16.6 7.4L18 6" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </div>
            <h3 className="ease-title">
              AI that lends a hand
              <span className="ease-pill">New</span>
            </h3>
            <p className="ease-desc">
              Turn plain sentences into organized tasks, get daily summaries, and let AI suggest priorities.
            </p>
          </div>
        </div>
      </section>

      {/* 5 — Honest facts */}
      <section className="stats reveal">
        <div className="stat">
          <div className="stat-num">$0</div>
          <div className="stat-label">Free, forever</div>
        </div>
        <div className="stat">
          <div className="stat-num">OSS</div>
          <div className="stat-label">Open source on GitHub</div>
        </div>
        <div className="stat">
          <div className="stat-num">AI</div>
          <div className="stat-label">Built right in</div>
        </div>
        <div className="stat">
          <div className="stat-num">1-tap</div>
          <div className="stat-label">Sign in, no accounts to make</div>
        </div>
      </section>

      {/* 6 — Final CTA */}
      <section className="cta reveal">
        <h2 className="cta-title">Start your workspace.</h2>
        <p className="cta-subtitle">
          Free forever. Upgrade only when you outgrow it.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={signup}>
            Join Now
          </button>
          <button className="btn-secondary" onClick={login}>
            I have an account
          </button>
        </div>
      </section>

      <footer className="footer">
        <span>Taskara © 2026</span>
        <span className="footer-dot">·</span>
        <span>Secured by Auth0</span>
        <span className="footer-dot">·</span>
        <span>Made with care</span>
      </footer>
    </div>
  );
}

export default HomePage;

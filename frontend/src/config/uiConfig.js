const env = import.meta.env;

export const uiConfig = {
  appName: env.VITE_APP_NAME || 'Taskara',
  appTagline: env.VITE_APP_TAGLINE || 'Plan Boldly. Finish Calmly.',
  homeTitle: env.VITE_HOME_LOGIN_TITLE || 'Welcome to your task workspace',
  homeSubtitle:
    env.VITE_HOME_LOGIN_SUBTITLE ||
    'Sign in to view tasks, dashboards, and collaboration details.',
  loginButtonLabel: env.VITE_LOGIN_BUTTON_LABEL || 'Log In',
  signupButtonLabel: env.VITE_SIGNUP_BUTTON_LABEL || 'Create Account',
};

export const uiText = {
  home: {
    badge: 'Taskara',
    title: 'Sign in to continue',
    subtitle: 'Open your workspace.',
    authProvider: 'Auth0',
  },
  login: {
    workspaceEyebrow: 'Taskara Workspace',
    workspaceTitle: 'Work together in one board',
    workspaceSubtitle: 'Tasks, owners, and progress in one place.',
    secureAccessEyebrow: 'Secure Access',
    secureAccessSubtitle: 'Sign in to access your workspace.',
    quickPoints: ['Track tasks', 'Assign owners', 'View progress'],
    stats: [
      { label: 'Teams', value: '12' },
      { label: 'Tasks', value: '280+' },
      { label: 'Uptime', value: '99.9%' },
    ],
    securityBadges: ['Auth0 protected', 'OAuth ready', 'Role based access'],
    footnote: 'Use your school/team identity account.',
  },
  register: {
    eyebrow: 'Create Account',
    subtitle: 'Create your account to collaborate on tasks, dashboards, and shared project workflows.',
  },
};
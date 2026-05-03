import { Component } from 'react';

// Last-resort UI when a render throws. Keeps the rest of the app from
// going completely blank. Wrap the route tree once near the top.
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary-card">
          <h1 className="error-boundary-title">Something broke.</h1>
          <p className="error-boundary-body">
            The page hit an unexpected error. You can try again, or go back to the dashboard.
          </p>
          <pre className="error-boundary-detail">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="error-boundary-actions">
            <button type="button" className="nav-primary-btn" onClick={this.reset}>
              Try again
            </button>
            <a className="dash-link" href="/dashboard">Go to dashboard</a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

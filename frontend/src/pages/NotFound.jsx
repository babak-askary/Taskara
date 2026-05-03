import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="notfound">
      <p className="tasks-eyebrow">404</p>
      <h1 className="tasks-title">Page not found</h1>
      <p className="tasks-count">
        We couldn't find what you were looking for.
      </p>
      <div className="notfound-actions">
        <Link to="/dashboard" className="nav-primary-btn">Back to dashboard</Link>
        <Link to="/tasks" className="dash-link">View your tasks →</Link>
      </div>
    </div>
  );
}

export default NotFound;

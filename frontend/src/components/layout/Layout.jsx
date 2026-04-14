import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function Layout() {
  return (
    <div className="site-shell">
      <div className="orb orb-amber" aria-hidden="true" />
      <div className="orb orb-teal" aria-hidden="true" />
      <Navbar />
      <main className="site-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

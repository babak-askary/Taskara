import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppAuth } from './context/AuthContext.jsx';
import { TaskProvider } from './context/TaskContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { TasksPage } from './pages/TasksPage.jsx';
import { TaskDetailPage } from './pages/TaskDetailPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';

function App() {
  const { isLoading } = useAppAuth();

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <TaskProvider>
      <div className="app">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
            />
            <Route
              path="/tasks"
              element={<ProtectedRoute><TasksPage /></ProtectedRoute>}
            />
            <Route
              path="/tasks/:id"
              element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>}
            />
            <Route
              path="/profile"
              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </TaskProvider>
  );
}

export default App

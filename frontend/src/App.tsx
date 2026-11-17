import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="page-shell">
        <div className="loading-panel">Connecting to your workspace…</div>
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/auth'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/auth'} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

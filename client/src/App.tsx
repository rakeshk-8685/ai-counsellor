import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Onboarding from './pages/Onboarding.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Counsellor from './pages/Counsellor.tsx';
import Universities from './pages/Universities.tsx';
import ApplicationGuidance from './pages/ApplicationGuidance.tsx';
import AnimatedAuthPage from './pages/auth/AnimatedAuthPage';
import Pricing from './pages/Pricing';
import UniversityDashboard from './pages/admin/UniversityDashboard';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import AdminSignup from './pages/auth/AdminSignup';
import { useAuth } from './context/AuthContext';
import { StageGuard } from './components/StageGuard';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  // Admin Redirection: If admin tries to access student routes, redirect to their dashboard
  if (user?.role === 'university_admin' && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin/university" replace />;
  }
  if (user?.role === 'super_admin' && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin/super" replace />;
  }

  return <Outlet />;
};

// Admin Guard
const AdminRoute = ({ role }: { role: 'university_admin' | 'super_admin' }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== role) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="auth/login" element={<AnimatedAuthPage />} />
        <Route path="auth/signup" element={<AnimatedAuthPage />} />
        <Route path="auth/admin/signup" element={<AdminSignup />} />

        {/* Main Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="pricing" element={<Pricing />} />

          {/* Student Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="onboarding" element={<Onboarding />} />
            <Route element={<StageGuard requiredStage={2} />}>
              <Route path="dashboard" element={<Dashboard />} />
            </Route>
            <Route element={<StageGuard requiredStage={2} />}>
              <Route path="counsellor" element={<Counsellor />} />
            </Route>
            <Route element={<StageGuard requiredStage={3} />}>
              <Route path="universities" element={<Universities />} />
            </Route>
            <Route element={<StageGuard requiredStage={4} />}>
              <Route path="guidance" element={<ApplicationGuidance />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route path="admin" element={<ProtectedRoute />}>
            <Route element={<AdminRoute role="university_admin" />}>
              <Route path="university" element={<UniversityDashboard />} />
            </Route>
            <Route element={<AdminRoute role="super_admin" />}>
              <Route path="super" element={<SuperAdminDashboard />} />
            </Route>
          </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;


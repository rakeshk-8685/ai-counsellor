import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Onboarding from './pages/Onboarding.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Counsellor from './pages/Counsellor.tsx';
import Universities from './pages/Universities.tsx';
import ApplicationGuidance from './pages/ApplicationGuidance.tsx';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Pricing from './pages/Pricing';
import { useAuth } from './context/AuthContext';
import { StageGuard } from './components/StageGuard';

// Protected Route Wrapper
// Enforces authentication and stage progression
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />

          {/* Auth Routes */}
          <Route path="pricing" element={<Pricing />} />
          <Route path="auth/login" element={<Login />} />
          <Route path="auth/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Stage 1: Onboarding (Always accessible if authenticated but incomplete) */}
            <Route path="onboarding" element={<Onboarding />} />

            {/* Stage 2 Guard: Dashboard requires Onboarding done */}
            <Route element={<StageGuard requiredStage={2} />}>
              <Route path="dashboard" element={<Dashboard />} />
            </Route>

            {/* Stage 3 Guard: Counsellor requires (Onboarding + logic?) actually just needs Stage 2 access */}
            <Route element={<StageGuard requiredStage={2} />}>
              <Route path="counsellor" element={<Counsellor />} />
            </Route>

            {/* Stage 4 Guard: Universities requires Counsellor completion */}
            <Route element={<StageGuard requiredStage={3} />}>
              <Route path="universities" element={<Universities />} />
            </Route>

            {/* Stage 5 Guard: Guidance requires Locking */}
            <Route element={<StageGuard requiredStage={4} />}>
              <Route path="guidance" element={<ApplicationGuidance />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

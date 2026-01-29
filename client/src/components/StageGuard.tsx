import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface StageGuardProps {
    requiredStage: number; // 1: Onboarding, 2: Counsellor, 3: Shortlisting, 4: Locking
    fallbackPath?: string;
}

export const StageGuard = ({ requiredStage }: StageGuardProps) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div>Loading...</div>;

    if (!user || !user.progress) {
        // If no progress data (should fail-safe), go to login
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    // Strict Rule: If user is on an earlier stage than required, block them.
    // Example: requiredStage = 2 (Counsellor). If current_stage = 1 (Onboarding), Redirect to Onboarding.

    // Exception: If they are trying to access Onboarding (Stage 1) but are already at Stage 4, 
    // we usually let them go back (backward navigation is allowed), OR we might force them to dashboard?
    // The requirement says: "Lock future stages... Allow backward navigation ONLY to completed steps"

    // So blocking is for FUTURE steps.
    if (user.progress.current_stage < requiredStage) {
        const fallbacks = {
            1: '/onboarding',
            2: '/dashboard', // Dashboard acts as the hub for Stage 2 start
            3: '/counsellor',
            4: '/universities'
        };
        const redirect = fallbacks[user.progress.current_stage as 1 | 2 | 3 | 4] || '/dashboard';
        return <Navigate to={redirect} replace />;
    }

    return <Outlet />;
};

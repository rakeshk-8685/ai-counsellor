import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { GraduationCap, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { API_BASE } from '../../config';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import FloatingParticles from '../../components/auth/FloatingParticles';
import '../../styles/auth-animations.css';

type AuthMode = 'login' | 'signup';

interface FormErrors {
    fullName?: string;
    email?: string;
    password?: string;
    google?: string;
}

export default function AnimatedAuthPage() {
    const location = useLocation();
    const initialMode: AuthMode = location.pathname.includes('signup') ? 'signup' : 'login';
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [authMode, setAuthMode] = useState<'student' | 'admin'>('student');

    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // UI state
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [successMessage, setSuccessMessage] = useState('');

    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect authenticated users with Role Validation
    useEffect(() => {
        if (user) {
            // Dynamic Redirection based on Role (No Friction)
            if (['university_admin', 'super_admin'].includes(user.role)) {
                // If Admin, always go to Admin Dashboard
                navigate(user.role === 'super_admin' ? '/admin/super' : '/admin/university');
            } else {
                // If Student, always go to Student App
                const isComplete = user.progress?.onboarding_completed || user.profileCompleted;
                navigate(isComplete ? '/dashboard' : '/onboarding');
            }
        }
    }, [user, navigate]);

    // Sync mode with URL
    useEffect(() => {
        const newMode = location.pathname.includes('signup') ? 'signup' : 'login';
        setMode(newMode);
    }, [location.pathname]);

    // Toggle between login and signup
    const toggleMode = () => {
        setErrors({});
        const newMode = mode === 'login' ? 'signup' : 'login';
        navigate(`/auth/${newMode}`, { replace: true });
    };

    // Validation
    const validate = (): FormErrors => {
        const newErrors: FormErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (mode === 'signup' && !fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }
        if (!emailRegex.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        return newErrors;
    };

    // Sync user to backend
    const syncUserToBackend = async (uid: string, userEmail: string, userName: string) => {
        const res = await fetch(`${API_BASE}/api/auth/firebase-sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, email: userEmail, fullName: userName }),
        });

        if (!res.ok) {
            throw new Error('Backend sync failed');
        }
        return res.json();
    };

    // Handle email/password submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        setLoading(true);

        try {
            if (mode === 'signup') {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: fullName });
                await syncUserToBackend(userCredential.user.uid, email, fullName);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            console.error(`${mode} Error:`, err);

            if (err.code === 'auth/email-already-in-use') {
                setErrors({ email: 'This email is already registered' });
            } else if (err.code === 'auth/invalid-credential') {
                setErrors({ password: 'Invalid email or password' });
            } else if (err.code === 'auth/weak-password') {
                setErrors({ password: 'Password is too weak' });
            } else {
                setErrors({ email: err.message });
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle Google OAuth
    const handleGoogleAuth = async () => {
        setGoogleLoading(true);
        setErrors({});

        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });

            const result = await signInWithPopup(auth, provider);
            await syncUserToBackend(
                result.user.uid,
                result.user.email || '',
                result.user.displayName || 'User'
            );
        } catch (err: any) {
            console.error('Google Auth Error:', err);

            if (err.code === 'auth/popup-closed-by-user') {
                setErrors({ google: 'Sign-in cancelled' });
            } else if (err.code === 'auth/popup-blocked') {
                setErrors({ google: 'Popup blocked. Please allow popups.' });
            } else {
                setErrors({ google: err.message || 'Google sign-in failed' });
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    // Handle forgot password
    const handleForgotPassword = async () => {
        if (!email) {
            setErrors({ email: 'Enter your email to reset password' });
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMessage('Password reset email sent!');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (err: any) {
            setErrors({ email: err.message });
        }
    };

    // Smooth animation variants
    const pageVariants: Variants = {
        initial: { opacity: 0, y: 20 },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: "easeOut"
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        }
    };

    const itemVariants: Variants = {
        initial: { opacity: 0, y: 10 },
        animate: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.3,
                ease: "easeOut"
            }
        })
    };

    return (
        <div className="auth-background">
            <FloatingParticles />

            <motion.div
                className="auth-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="auth-form-container"
                    >
                        {/* Role Switcher */}
                        <div className="flex justify-center mb-6">
                            <div className="bg-slate-100 p-1 rounded-xl inline-flex relative">
                                <button
                                    onClick={() => setAuthMode('student')}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 z-10 ${authMode === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Student
                                </button>
                                <button
                                    onClick={() => {
                                        setAuthMode('admin');
                                        setMode('login'); // Admin only has login
                                    }}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 z-10 ${authMode === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    University / Admin
                                </button>
                            </div>
                        </div>
                        {/* Logo */}
                        <motion.div
                            className="auth-logo"
                            variants={itemVariants}
                            custom={0}
                            initial="initial"
                            animate="animate"
                        >
                            {authMode === 'admin' ? <Lock className="w-8 h-8 text-indigo-600" /> : <GraduationCap />}
                        </motion.div>

                        {/* Header */}
                        <motion.div
                            variants={itemVariants}
                            custom={1}
                            initial="initial"
                            animate="animate"
                        >
                            <h1 className="auth-title">
                                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                            </h1>
                            <p className="auth-subtitle">
                                {mode === 'login'
                                    ? 'Continue your study abroad journey'
                                    : 'Start your path to higher education'
                                }
                            </p>
                        </motion.div>

                        {/* Google Button - Only for Students */}
                        {authMode === 'student' && (
                            <motion.div
                                variants={itemVariants}
                                custom={2}
                                initial="initial"
                                animate="animate"
                            >
                                <button
                                    type="button"
                                    onClick={handleGoogleAuth}
                                    disabled={googleLoading || loading}
                                    className="auth-btn-google"
                                >
                                    {googleLoading ? (
                                        <div className="auth-spinner" style={{ borderColor: '#e2e8f0', borderTopColor: '#4f46e5' }} />
                                    ) : (
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                    )}
                                    {googleLoading ? 'Signing in...' : 'Continue with Google'}
                                </button>
                                {errors.google && (
                                    <p className="auth-error">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.google}
                                    </p>
                                )}
                            </motion.div>
                        )}

                        {/* Divider */}
                        {authMode === 'student' && (
                            <motion.div
                                className="auth-divider"
                                variants={itemVariants}
                                custom={3}
                                initial="initial"
                                animate="animate"
                            >
                                <span>or</span>
                            </motion.div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                {/* Full Name (Signup only) */}
                                <AnimatePresence mode="wait">
                                    {mode === 'signup' && (
                                        <motion.div
                                            key="fullname"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <label className="auth-label">Full Name</label>
                                            <div className="auth-input-wrapper">
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    placeholder="Your full name"
                                                    className={`auth-input ${errors.fullName ? 'error' : ''}`}
                                                    autoComplete="name"
                                                />
                                                <User className="auth-input-icon w-4 h-4" />
                                            </div>
                                            {errors.fullName && (
                                                <p className="auth-error">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {errors.fullName}
                                                </p>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Email */}
                                <motion.div
                                    variants={itemVariants}
                                    custom={4}
                                    initial="initial"
                                    animate="animate"
                                >
                                    <label className="auth-label">Email</label>
                                    <div className="auth-input-wrapper">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className={`auth-input ${errors.email ? 'error' : ''}`}
                                            autoComplete="email"
                                        />
                                        <Mail className="auth-input-icon w-4 h-4" />
                                    </div>
                                    {errors.email && (
                                        <p className="auth-error">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.email}
                                        </p>
                                    )}
                                </motion.div>

                                {/* Password */}
                                <motion.div
                                    variants={itemVariants}
                                    custom={5}
                                    initial="initial"
                                    animate="animate"
                                >
                                    <div className="flex items-center justify-between">
                                        <label className="auth-label">Password</label>
                                        {mode === 'login' && (
                                            <button
                                                type="button"
                                                onClick={handleForgotPassword}
                                                className="auth-link text-xs"
                                            >
                                                Forgot password?
                                            </button>
                                        )}
                                    </div>
                                    <div className="auth-input-wrapper">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className={`auth-input pr-11 ${errors.password ? 'error' : ''}`}
                                            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                        />
                                        <Lock className="auth-input-icon w-4 h-4" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="auth-error">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.password}
                                        </p>
                                    )}
                                </motion.div>

                                {/* Success Message */}
                                <AnimatePresence>
                                    {successMessage && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-emerald-600 text-sm text-center py-2 bg-emerald-50 rounded-lg"
                                        >
                                            {successMessage}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Submit Button */}
                                <motion.div
                                    variants={itemVariants}
                                    custom={6}
                                    initial="initial"
                                    animate="animate"
                                    className="pt-2"
                                >
                                    <button
                                        type="submit"
                                        disabled={loading || googleLoading}
                                        className="auth-btn-primary"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="auth-spinner" />
                                                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                                            </span>
                                        ) : (
                                            mode === 'login' ? 'Sign In' : 'Create Account'
                                        )}
                                    </button>
                                </motion.div>
                            </div>
                        </form>

                        {/* Footer Toggle */}
                        {authMode === 'student' ? (
                            <motion.div
                                className="auth-footer"
                                variants={itemVariants}
                                custom={7}
                                initial="initial"
                                animate="animate"
                            >
                                {mode === 'login' ? (
                                    <>
                                        Don't have an account?{' '}
                                        <button onClick={toggleMode} className="auth-link">
                                            Sign up
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Already have an account?{' '}
                                        <button onClick={toggleMode} className="auth-link">
                                            Sign in
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                className="auth-footer flex flex-col items-center gap-2 mt-6"
                                variants={itemVariants}
                                custom={7}
                                initial="initial"
                                animate="animate"
                            >
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Partner Registration</p>
                                <div className="flex gap-4 text-sm">
                                    <button
                                        onClick={() => navigate('/auth/admin/signup?role=university_admin')}
                                        className="text-slate-600 hover:text-indigo-600 font-medium transition-colors"
                                    >
                                        University
                                    </button>
                                    <span className="text-slate-300">|</span>
                                    <button
                                        onClick={() => navigate('/auth/admin/signup?role=super_admin')}
                                        className="text-slate-600 hover:text-indigo-600 font-medium transition-colors"
                                    >
                                        Super Admin
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

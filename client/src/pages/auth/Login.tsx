import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { signInWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { API_BASE } from '../../config';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; google?: string }>({});
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect authenticated users
    useEffect(() => {
        if (user) {
            const isComplete = user.progress?.onboarding_completed || user.profileCompleted;
            if (isComplete) {
                navigate('/dashboard');
            } else {
                navigate('/onboarding');
            }
        }
    }, [user, navigate]);

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            newErrors.email = "Please enter a valid email address.";
        }
        if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters long.";
        }
        return newErrors;
    };

    const handleForgotPassword = async () => {
        if (!email) {
            alert("Please enter your email address first.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Password reset email sent! Check your inbox.");
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    // ========================================
    // EMAIL/PASSWORD LOGIN
    // ========================================
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
            await signInWithEmailAndPassword(auth, email, password);
            // Navigation handled by useEffect
        } catch (err: any) {
            console.error('Email Login Error:', err);
            if (err.code === 'auth/invalid-credential') {
                setErrors({ password: 'Invalid email or password.' });
            } else {
                setErrors({ email: err.message });
            }
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // GOOGLE OAUTH LOGIN
    // ========================================
    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setErrors({});

        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;

            // Sync to backend - creates user if first time, fetches if existing
            const res = await fetch(`${API_BASE}/api/auth/firebase-sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    fullName: firebaseUser.displayName || 'User'
                }),
            });

            if (!res.ok) {
                console.error('Backend sync failed');
            }

            // Navigation handled by AuthContext listener + useEffect

        } catch (err: any) {
            console.error('Google Login Error:', err);

            if (err.code === 'auth/popup-closed-by-user') {
                setErrors({ google: 'Sign-in cancelled. Please try again.' });
            } else if (err.code === 'auth/popup-blocked') {
                setErrors({ google: 'Popup blocked. Please allow popups for this site.' });
            } else {
                setErrors({ google: err.message || 'Google sign-in failed. Please try again.' });
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <p className="text-sm text-slate-500">Login to continue your journey</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* ========================================
                        GOOGLE LOGIN BUTTON
                    ======================================== */}
                    <Button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={googleLoading || loading}
                        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
                    >
                        {googleLoading ? (
                            <div className="h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        )}
                        {googleLoading ? 'Signing in...' : 'Continue with Google'}
                    </Button>

                    {errors.google && (
                        <p className="text-xs text-red-500 text-center">{errors.google}</p>
                    )}

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                        </div>
                    </div>

                    {/* ========================================
                        EMAIL/PASSWORD FORM
                    ======================================== */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={errors.email ? "border-red-500" : ""}
                                required
                                autoComplete="username"
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={errors.password ? "border-red-500" : ""}
                                required
                                autoComplete="current-password"
                            />
                            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                        <div className="text-center text-sm text-slate-500">
                            Don't have an account? <Link to="/auth/signup" className="text-indigo-600 hover:underline">Sign up</Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { API_BASE } from '../../config';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { auth } from '../../lib/firebase';
import {
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithPopup,
    GoogleAuthProvider
} from 'firebase/auth';

export default function Signup() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; google?: string }>({});
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect authenticated users to onboarding
    useEffect(() => {
        if (user) {
            navigate('/onboarding');
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

    // ========================================
    // EMAIL/PASSWORD SIGNUP
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
            // 1. Firebase Signup
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            // 2. Set Display Name
            await updateProfile(firebaseUser, { displayName: fullName });

            // 3. Sync to Backend (creates user in PostgreSQL)
            await syncUserToBackend(firebaseUser.uid, firebaseUser.email || '', fullName);

            // Navigation handled by AuthContext listener + useEffect

        } catch (err: any) {
            console.error('Email Signup Error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setErrors({ email: 'Email is already registered.' });
            } else {
                setErrors({ email: err.message });
            }
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // GOOGLE OAUTH SIGNUP
    // ========================================
    const handleGoogleSignup = async () => {
        setGoogleLoading(true);
        setErrors({});

        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account' // Force account selection
            });

            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;

            // Sync to backend - creates user if first time, fetches if existing
            await syncUserToBackend(
                firebaseUser.uid,
                firebaseUser.email || '',
                firebaseUser.displayName || 'User'
            );

            // Navigation handled by AuthContext listener + useEffect

        } catch (err: any) {
            console.error('Google Signup Error:', err);

            // Handle specific error cases
            if (err.code === 'auth/popup-closed-by-user') {
                setErrors({ google: 'Sign-in cancelled. Please try again.' });
            } else if (err.code === 'auth/popup-blocked') {
                setErrors({ google: 'Popup blocked. Please allow popups for this site.' });
            } else if (err.code === 'auth/account-exists-with-different-credential') {
                setErrors({ google: 'An account already exists with this email using a different sign-in method.' });
            } else {
                setErrors({ google: err.message || 'Google sign-in failed. Please try again.' });
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    // ========================================
    // SYNC USER TO BACKEND
    // ========================================
    const syncUserToBackend = async (uid: string, email: string, fullName: string) => {
        const res = await fetch(`${API_BASE}/api/auth/firebase-sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, email, fullName }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Backend sync failed');
        }

        console.log('Backend Sync Success');
        return res.json();
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Create Account</CardTitle>
                    <p className="text-sm text-slate-500">Start your study abroad journey</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* ========================================
                        GOOGLE SIGNUP BUTTON
                    ======================================== */}
                    <Button
                        type="button"
                        onClick={handleGoogleSignup}
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
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                autoComplete="name"
                            />
                        </div>
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
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={errors.password ? "border-red-500" : ""}
                                required
                                autoComplete="new-password"
                            />
                            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </Button>
                        <div className="text-center text-sm text-slate-500">
                            Already have an account? <Link to="/auth/login" className="text-indigo-600 hover:underline">Login</Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

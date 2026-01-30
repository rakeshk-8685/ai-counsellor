import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Building, ShieldAlert, Award } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { API_BASE } from '../../config';
import FloatingParticles from '../../components/auth/FloatingParticles';
import '../../styles/auth-animations.css';

export default function AdminSignup() {
    const [searchParams] = useSearchParams();
    const roleParam = searchParams.get('role');
    const role = roleParam === 'super_admin' ? 'super_admin' : 'university_admin';
    const isSuper = role === 'super_admin';

    const navigate = useNavigate();

    // Form
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [orgName, setOrgName] = useState('');
    const [secretCode, setSecretCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            // 1. Create Firebase User
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCred.user, { displayName: fullName });

            // 2. Register in Postgres
            const res = await fetch(`${API_BASE}/api/auth/admin/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: userCred.user.uid,
                    email,
                    fullName,
                    password, // Sent for hash backup
                    role,
                    organizationName: isSuper ? 'AI Counsellor HQ' : orgName,
                    secretCode: isSuper ? secretCode : undefined
                })
            });

            const data = await res.json();

            if (!res.ok) {
                // Determine if we need to rollback Firebase user?
                // For prototype, we show error. User exists in Firebase but not DB properly.
                // But next retry might fix it due to "DELETE legacy" logic in backend.
                throw new Error(data.error || 'Registration failed');
            }

            setSuccess('Account created successfully! Redirecting...');

            // 3. Redirect
            setTimeout(() => {
                navigate(isSuper ? '/admin/super' : '/admin/university');
            }, 1000);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create account");
            setLoading(false);
        }
    };

    return (
        <div className="auth-background">
            <FloatingParticles />

            <motion.div
                className="auth-card max-w-md w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        {isSuper ?
                            <ShieldAlert className="w-12 h-12 text-indigo-600" /> :
                            <Building className="w-12 h-12 text-indigo-600" />
                        }
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isSuper ? 'Super Admin Registration' : 'University Partner Registration'}
                    </h1>
                    <p className="text-slate-500 mt-2">
                        {isSuper ? 'Authorized Personnel Only' : 'Join our network of educational institutions'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div className="auth-input-wrapper">
                        <input
                            type="text"
                            placeholder="Full Name"
                            className="auth-input pl-10"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            required
                        />
                        <User className="auth-input-icon w-5 h-5" />
                    </div>

                    {/* Email */}
                    <div className="auth-input-wrapper">
                        <input
                            type="email"
                            placeholder="Official Email"
                            className="auth-input pl-10"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <Mail className="auth-input-icon w-5 h-5" />
                    </div>

                    {/* Organization Name (Uni Only) */}
                    {!isSuper && (
                        <div className="auth-input-wrapper">
                            <input
                                type="text"
                                placeholder="University / Organization Name"
                                className="auth-input pl-10"
                                value={orgName}
                                onChange={e => setOrgName(e.target.value)}
                                required
                            />
                            <Building className="auth-input-icon w-5 h-5" />
                        </div>
                    )}

                    {/* Secret Code (Super Only) */}
                    {isSuper && (
                        <div className="auth-input-wrapper border-red-200 focus-within:border-red-500">
                            <input
                                type="password"
                                placeholder="Secret Invite Code"
                                className="auth-input pl-10 text-red-600"
                                value={secretCode}
                                onChange={e => setSecretCode(e.target.value)}
                                required
                            />
                            <Award className="auth-input-icon w-5 h-5 text-red-400" />
                        </div>
                    )}

                    {/* Password */}
                    <div className="auth-input-wrapper">
                        <input
                            type="password"
                            placeholder="Password"
                            className="auth-input pl-10"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <Lock className="auth-input-icon w-5 h-5" />
                    </div>

                    {/* Confirm Password */}
                    <div className="auth-input-wrapper">
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            className="auth-input pl-10"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                        />
                        <Lock className="auth-input-icon w-5 h-5" />
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-green-50 text-green-600 text-sm p-3 rounded-lg text-center"
                            >
                                {success}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/auth/login')}
                            className="text-slate-500 hover:text-indigo-600 text-sm font-medium"
                        >
                            Return to Login
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

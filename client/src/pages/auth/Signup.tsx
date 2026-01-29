import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

export default function Signup() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const { user } = useAuth(); // login no longer needed
    const navigate = useNavigate();

    // Fix Race Condition: Wait for user state to update before navigating
    // This ensures ProtectedRoute sees the user as authenticated
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
            const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
            const { auth } = await import('../../lib/firebase');

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Set Display Name
            await updateProfile(user, { displayName: fullName });

            // 3. Sync to Backend
            const res = await fetch('http://localhost:5000/api/auth/firebase-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    fullName: fullName
                }),
            });

            if (!res.ok) {
                console.error("Backend Sync Failed");
                // Optional: Delete firebase user if sync fails?
            } else {
                console.log("Backend Sync Success");
            }

            // Navigation handled by AuthContext listener + useEffect

        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setErrors({ email: 'Email is already registered.' });
            } else {
                alert('Signup failed: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Create Account</CardTitle>
                    <p className="text-sm text-slate-500">Start your study abroad journey</p>
                </CardHeader>
                <CardContent>
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
                        </div>
                        <Button type="submit" className="w-full" isLoading={loading}>
                            Sign Up
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

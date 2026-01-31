import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { API_BASE } from '../config';

interface User {
    id: string; // Firebase UID
    full_name: string; // Display Name
    email: string;
    profileCompleted?: boolean;
    progress?: {
        onboarding_completed: boolean;
        counsellor_completed: boolean;
        shortlisting_completed: boolean;
        application_locked: boolean;
        current_stage: number;
    };
    role: 'student' | 'university_admin' | 'super_admin';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const idToken = await firebaseUser.getIdToken();
                setToken(idToken);

                // We need to fetch the "App User" data (progress, profile) from our postgres DB
                // For now, we'll construct a basic user object from Firebase
                // In a real app, we'd fetch /api/me to get the strict SQL data
                setUser({
                    id: firebaseUser.uid,
                    full_name: firebaseUser.displayName || 'User',
                    email: firebaseUser.email || '',
                    role: 'student', // Default, will be updated by sync
                    // Default progress, will be updated by Dashboard fetch or manual updateUser
                    progress: {
                        onboarding_completed: false, // Default, will sync later
                        counsellor_completed: false,
                        shortlisting_completed: false,
                        application_locked: false,
                        current_stage: 1
                    }
                });

                // Sync User with Postgres & Fetch Progress
                fetch(`${API_BASE}/api/auth/firebase-sync`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        fullName: firebaseUser.displayName || 'User'
                    })
                })
                    .then(res => {
                        if (!res.ok) throw new Error("Sync Failed");
                        return res.json();
                    })
                    .then(data => {
                        // data should contain { user: { ..., progress: ... } }
                        setUser(data.user);
                    })
                    .catch(e => {
                        console.error("CRITICAL: Failed to sync user/progress", e);
                        // Prevent Ghost Sessions: If sync fails, user must not proceed
                        setUser(null);
                        setToken(null);
                        alert("Account synchronization failed. Please check your connection or try again.");
                    });

            } else {
                setUser(null);
                setToken(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setToken(null);
    };

    const updateUser = (updates: Partial<User>) => {
        setUser(prev => prev ? ({ ...prev, ...updates }) : null);
    };

    return (
        <AuthContext.Provider value={{ user, token, logout, updateUser, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

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
                try {
                    const idToken = await firebaseUser.getIdToken();
                    setToken(idToken);

                    // Sync User with Postgres & Fetch Progress
                    // We AWAIT this fetch so loading stays true until we have the DB user
                    const res = await fetch(`${API_BASE}/api/auth/firebase-sync`, {
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
                    });

                    if (!res.ok) throw new Error("Sync Failed");
                    const data = await res.json();

                    setUser(data.user);
                } catch (e) {
                    console.error("CRITICAL: Failed to sync user/progress", e);
                    // Prevent Ghost Sessions: If sync fails, user must not proceed
                    setUser(null);
                    setToken(null);
                    alert("Account synchronization failed. Please check your connection or try again.");
                } finally {
                    setLoading(false); // Only stop loading after fetch is done
                }

            } else {
                setUser(null);
                setToken(null);
                setLoading(false);
            }
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

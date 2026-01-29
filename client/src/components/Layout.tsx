import { Link, useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button'; // Assuming you have an exported Button component
import { GraduationCap, LogOut, Lock as LockIcon } from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/auth/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <header className="sticky top-0 z-50 w-full border-b border-white/50 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                            UniPath
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                        {user ? (
                            <>
                                <>
                                    <Link to="/dashboard" className="transition-colors hover:text-indigo-600">Dashboard</Link>

                                    {/* Stage 2+ (Discovery) */}
                                    {(user.progress?.current_stage || 1) >= 2 ? (
                                        <Link to="/counsellor" className="transition-colors hover:text-indigo-600">AI Counsellor</Link>
                                    ) : (
                                        <span className="text-slate-300 cursor-not-allowed flex items-center gap-1">AI Counsellor <LockIcon size={12} /></span>
                                    )}

                                    {/* Stage 3+ (Universities) */}
                                    {(user.progress?.current_stage || 1) >= 3 ? (
                                        <Link to="/universities" className="transition-colors hover:text-indigo-600">Universities</Link>
                                    ) : (
                                        <span className="text-slate-300 cursor-not-allowed flex items-center gap-1">Universities <LockIcon size={12} /></span>
                                    )}
                                </>
                            </>
                        ) : (
                            <Link to="#features" className="transition-colors hover:text-indigo-600">Features</Link>
                        )}
                        <Link to="/pricing" className="transition-colors hover:text-indigo-600">Pricing</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-slate-900 hidden sm:block">{user.full_name}</span>
                                <Button variant="ghost" onClick={handleLogout} size="sm">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Link to="/auth/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
                                    Log in
                                </Link>
                                <Link to="/auth/signup">
                                    <Button size="sm">Get Started</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;

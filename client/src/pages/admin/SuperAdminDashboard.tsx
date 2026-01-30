import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader2, Users, FileText, CheckCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config';

interface Stats {
    totalUsers: number;
    totalStudents: number;
    totalApplications: number;
    completedProfiles: number;
}

interface Student {
    id: string;
    full_name: string;
    email: string;
    role: string;
    current_stage: number;
    profile_status: string;
}

export default function SuperAdminDashboard() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'admins' | 'universities'>('overview');

    // Overview States
    const [stats, setStats] = useState<Stats | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    // Admin Management States
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [universities, setUniversities] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
        if (activeTab === 'admins') fetchUsers();
        if (activeTab === 'universities') fetchUniversities();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            const [statsRes, studentsRes] = await Promise.all([
                fetch(`${API_BASE}/api/admin/super/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE}/api/admin/university/students`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (studentsRes.ok) setStudents(await studentsRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        const res = await fetch(`${API_BASE}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setAllUsers(await res.json());
    };

    const fetchUniversities = async () => {
        const res = await fetch(`${API_BASE}/api/admin/universities`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setUniversities(await res.json());
    };

    const handleStatusToggle = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

        try {
            const res = await fetch(`${API_BASE}/api/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchUsers(); // Refresh
            }
        } catch (err) {
            alert("Failed to update status");
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Super Admin Console</h1>
                <p className="text-slate-600">System Overview & Governance</p>

                {/* Navigation Tabs */}
                <div className="flex gap-4 mt-6 border-b border-slate-200">
                    {['overview', 'admins', 'universities'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-3 px-1 text-sm font-medium capitalize transition-colors border-b-2 ${activeTab === tab
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                        <Card className="border-t-4 border-indigo-500 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Total Users</p>
                                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalUsers || 0}</h3>
                                    </div>
                                    <Users className="h-5 w-5 text-indigo-200" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-t-4 border-blue-500 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Students</p>
                                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalStudents || 0}</h3>
                                    </div>
                                    <GraduationCap className="h-5 w-5 text-blue-200" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-t-4 border-emerald-500 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Completed Profiles</p>
                                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.completedProfiles || 0}</h3>
                                    </div>
                                    <CheckCircle className="h-5 w-5 text-emerald-200" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-t-4 border-amber-500 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Active Apps</p>
                                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalApplications || 0}</h3>
                                    </div>
                                    <FileText className="h-5 w-5 text-amber-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Student List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-slate-700" />
                                Recent Students
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 border-b">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Name</th>
                                            <th className="px-4 py-3 font-medium">Email</th>
                                            <th className="px-4 py-3 font-medium">Stage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {students.slice(0, 5).map((s) => (
                                            <tr key={s.id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-medium text-slate-900">{s.full_name}</td>
                                                <td className="px-4 py-3 text-slate-500">{s.email}</td>
                                                <td className="px-4 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">Stage {s.current_stage}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* ADMINS TAB */}
            {activeTab === 'admins' && (
                <Card>
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 border-b">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Organization</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map(u => (
                                    <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium">{u.full_name}</td>
                                        <td className="px-4 py-3 text-slate-500">{u.email}</td>
                                        <td className="px-4 py-3"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs capitalize">{u.role.replace('_', ' ')}</span></td>
                                        <td className="px-4 py-3 text-slate-500">{u.organization_name || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs capitalize ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {u.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {u.role !== 'super_admin' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleStatusToggle(u.id, u.status || 'active')}
                                                    className={u.status === 'active' ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}
                                                >
                                                    {u.status === 'active' ? 'Suspend' : 'Activate'}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* UNIVERSITIES TAB */}
            {activeTab === 'universities' && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Registered Universities</CardTitle>
                            <Button size="sm">Add University</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-600 border-b">
                                <tr>
                                    <th className="px-4 py-3">University Name</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Ranking</th>
                                </tr>
                            </thead>
                            <tbody>
                                {universities.map(uni => (
                                    <tr key={uni.id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium">{uni.name}</td>
                                        <td className="px-4 py-3 text-slate-500">{uni.location}, {uni.country}</td>
                                        <td className="px-4 py-3">#{uni.ranking || 'N/A'}</td>
                                    </tr>
                                ))}
                                {universities.length === 0 && (
                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No universities found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function GraduationCap(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 0 6-3 6-3s3 3 6 3v-5" />
        </svg>
    )
}



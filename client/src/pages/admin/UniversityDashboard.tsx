import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Loader2, Search, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config';

interface Student {
    id: string;
    full_name: string;
    email: string;
    role: string;
    current_stage: number;
    onboarding_completed: boolean;
    profile_status: string;
}

export default function UniversityDashboard() {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'university' | 'profile'>('overview');

    // Overview States
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // University/Profile States
    const [university, setUniversity] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        fetchStudents();
        if (activeTab === 'university') fetchUniversity();
        if (activeTab === 'profile') fetchProfile();
    }, [activeTab]);

    const fetchStudents = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/university/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setStudents(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUniversity = async () => {
        const res = await fetch(`${API_BASE}/api/admin/universities`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            if (data.length > 0) setUniversity(data[0]);
        }
    };

    const fetchProfile = async () => {
        const res = await fetch(`${API_BASE}/api/admin/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setProfile(await res.json());
    };

    const handleUniversityUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!university) return;
        try {
            const res = await fetch(`${API_BASE}/api/admin/universities/${university.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(university)
            });
            if (res.ok) alert("University Updated Successfully!");
            else alert("Failed to update");
        } catch (err) { alert("Error saving university"); }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/api/admin/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(profile)
            });
            if (res.ok) alert("Profile Updated Successfully!");
        } catch (err) { alert("Error saving profile"); }
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );

    const getStageName = (stage: number) => {
        const stages = ["Onboarding", "Discovery", "Finalizing", "App Prep", "Guidance"];
        return stages[stage - 1] || "Unknown";
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <header className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">University Admin Portal</h1>
                        <p className="text-slate-600">Overview of Student Applications</p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-4 mt-6 border-b border-slate-200">
                    {['overview', 'university', 'profile'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-3 px-1 text-sm font-medium capitalize transition-colors border-b-2 ${activeTab === tab
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab === 'university' ? 'My University' : tab}
                        </button>
                    ))}
                </div>
            </header>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <>
                    <div className="flex justify-end mb-4 relative w-full md:w-64 ml-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                                    Registered Students ({filteredStudents.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-600 border-b">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Name</th>
                                                <th className="px-4 py-3 font-medium">Email</th>
                                                <th className="px-4 py-3 font-medium">Profile Status</th>
                                                <th className="px-4 py-3 font-medium">Stage</th>
                                                <th className="px-4 py-3 font-medium text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredStudents.length > 0 ? filteredStudents.map((s) => (
                                                <tr key={s.id} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-medium text-slate-900">{s.full_name}</td>
                                                    <td className="px-4 py-3 text-slate-500">{s.email}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.profile_status === 'complete' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {s.profile_status === 'complete' ? 'Complete' : 'Incomplete'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-20 rounded-full bg-slate-100 overflow-hidden">
                                                                <div
                                                                    className="h-full bg-indigo-500"
                                                                    style={{ width: `${(s.current_stage / 5) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs text-slate-600">{getStageName(s.current_stage)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button size="sm" variant="outline" className="h-8">View Details</Button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">
                                                        No students found matching your search.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* MY UNIVERSITY TAB */}
            {activeTab === 'university' && (
                <Card>
                    <CardHeader><CardTitle>My University Profile</CardTitle></CardHeader>
                    <CardContent>
                        {university ? (
                            <form onSubmit={handleUniversityUpdate} className="grid gap-4 max-w-2xl">
                                <div>
                                    <label className="block text-sm font-medium mb-1">University Name</label>
                                    <input type="text" className="w-full p-2 border rounded" value={university.name} onChange={e => setUniversity({ ...university, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Country</label>
                                        <input type="text" className="w-full p-2 border rounded" value={university.country} onChange={e => setUniversity({ ...university, country: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Location / City</label>
                                        <input type="text" className="w-full p-2 border rounded" value={university.location} onChange={e => setUniversity({ ...university, location: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea className="w-full p-2 border rounded h-24" value={university.description} onChange={e => setUniversity({ ...university, description: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Ranking</label>
                                        <input type="number" className="w-full p-2 border rounded" value={university.ranking} onChange={e => setUniversity({ ...university, ranking: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Tuition Fee</label>
                                        <input type="text" className="w-full p-2 border rounded" value={university.tuition_fee} onChange={e => setUniversity({ ...university, tuition_fee: e.target.value })} />
                                    </div>
                                </div>
                                <Button type="submit" className="mt-4">Save Changes</Button>
                            </form>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-slate-500 mb-4">No University Record Found.</p>
                                <Button onClick={() => setActiveTab('profile')}>Update your Organization Name first</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
                <Card>
                    <CardHeader><CardTitle>Admin Profile</CardTitle></CardHeader>
                    <CardContent>
                        {profile && (
                            <form onSubmit={handleProfileUpdate} className="grid gap-4 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Full Name</label>
                                    <input type="text" className="w-full p-2 border rounded" value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input type="text" className="w-full p-2 border rounded bg-slate-50 text-slate-500" value={profile.email} disabled />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Organization Name</label>
                                    <input type="text" className="w-full p-2 border rounded" value={profile.organization_name} onChange={e => setProfile({ ...profile, organization_name: e.target.value })} />
                                    <p className="text-xs text-slate-500 mt-1">This links you to your University record.</p>
                                </div>
                                <Button type="submit" className="mt-4">Update Profile</Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Lock, Unlock, MapPin, CheckCircle, Search, Plus, Filter, Sparkles, GraduationCap } from 'lucide-react';

interface University {
    id: string; // For discovery items (number) or shortlist items (uuid)
    university_name?: string; // Shortlist Format
    name?: string; // Discovery Format
    status?: 'recommended' | 'refused' | 'shortlisted' | 'locked';
    university_data?: any; // Shortlist Format
    // Discovery Format Fields
    country?: string;
    tuition_fee?: number;
    acceptance_rate?: number;
    matchLabel?: string;
    matchScore?: number;
    fitReason?: string;
    costDetails?: { total: string, affordable: boolean, message: string };
    image_url?: string;
    ranking?: number;
}

export default function Universities() {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState<'shortlist' | 'explore'>('explore');
    const [shortlist, setShortlist] = useState<University[]>([]);
    const [discovery, setDiscovery] = useState<University[]>([]);
    const [loading, setLoading] = useState(true);
    const [lockedId, setLockedId] = useState<string | null>(null);

    // Filters
    const [filterCountry, setFilterCountry] = useState('All');

    const [lockModal, setLockModal] = useState<{ open: boolean, id: string, name: string }>({ open: false, id: '', name: '' });
    const [unlockModal, setUnlockModal] = useState<{ open: boolean, id: string, name: string }>({ open: false, id: '', name: '' });
    const [unlockReason, setUnlockReason] = useState('');

    const fetchShortlist = () => {
        fetch(`http://localhost:5000/api/universities/shortlist?userId=${user?.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setShortlist(data.shortlists);
                const locked = data.shortlists.find((u: University) => u.status === 'locked');
                if (locked) setLockedId(locked.id);
            });
    };

    const fetchDiscovery = () => {
        setLoading(true);
        fetch(`http://localhost:5000/api/universities/discover?userId=${user?.id}&country=${filterCountry}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setDiscovery(data.universities);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        if (!user) return;
        fetchShortlist();
        fetchDiscovery();
    }, [user, token, filterCountry]);

    const addToShortlist = async (uni: University) => {
        try {
            await fetch('http://localhost:5000/api/universities/shortlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    userId: user?.id,
                    universityId: uni.id,
                    name: uni.name,
                    country: uni.country,
                    chance: uni.matchLabel
                })
            });
            fetchShortlist();
        } catch (e) {
            console.error(e);
        }
    };

    // Helper to check if already shortlisted
    const isShortlisted = (name: string) => shortlist.some(s => s.university_name === name);

    // --- LOCK FLOW ---
    const initLock = (uniId: string, uniName: string) => {
        setLockModal({ open: true, id: uniId, name: uniName });
    };

    const confirmLock = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/universities/lock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId: user?.id, universityId: lockModal.id })
            });
            if (res.ok) {
                setLockedId(lockModal.id);
                fetchShortlist();
                setLockModal({ open: false, id: '', name: '' });
            } else {
                const err = await res.json();
                alert(err.error); // Fallback for API error
            }
        } catch (e) { console.error(e); }
    };

    // --- UNLOCK FLOW ---
    const initUnlock = (uniId: string, uniName: string) => {
        setUnlockModal({ open: true, id: uniId, name: uniName });
        setUnlockReason('');
    };

    const confirmUnlock = async () => {
        if (!unlockReason.trim()) return alert("Please provide a reason to unlock.");
        try {
            const res = await fetch('http://localhost:5000/api/universities/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId: user?.id, universityId: unlockModal.id, reason: unlockReason })
            });
            if (res.ok) {
                setLockedId(null);
                fetchShortlist();
                setUnlockModal({ open: false, id: '', name: '' });
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl relative">
            {/* --- MODALS --- */}
            {lockModal.open && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <Lock className="h-8 w-8 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Lock {lockModal.name}?</h2>
                            <div className="text-slate-600 text-sm mb-6 bg-slate-50 p-4 rounded-lg text-left">
                                <p className="mb-2 font-medium">By locking this university, you are committing to:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Focusing your application efforts here.</li>
                                    <li>Unlocking detailed application guidance.</li>
                                    <li>Starting task tracking for this specific choice.</li>
                                </ul>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setLockModal({ ...lockModal, open: false })}>Cancel</Button>
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={confirmLock}>Yes, Lock it</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {unlockModal.open && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <Unlock className="h-8 w-8 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Unlock {unlockModal.name}?</h2>
                            <p className="text-slate-500 mb-4 text-sm">
                                Warning: Unlocking will reset your application progress and guidance steps for this university.
                            </p>

                            <div className="text-left mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Unlocking</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-200 outline-none transition-all"
                                    placeholder="e.g. Found a better option, Application too expensive..."
                                    rows={3}
                                    value={unlockReason}
                                    onChange={(e) => setUnlockReason(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setUnlockModal({ ...unlockModal, open: false })}>Cancel</Button>
                                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={confirmUnlock}>Confirm Unlock</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        University Discovery <Sparkles className="text-yellow-500 h-6 w-6" />
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Find your perfect academic match with AI-driven insights.
                    </p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('explore')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'explore' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <Search className="inline-block mr-2 h-4 w-4" /> Explore
                    </button>
                    <button
                        onClick={() => setActiveTab('shortlist')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'shortlist' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <CheckCircle className="inline-block mr-2 h-4 w-4" /> Shortlist
                        <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{shortlist.length}</span>
                    </button>
                </div>
            </div>

            {activeTab === 'explore' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Filter Bar */}
                    <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center text-slate-500 text-sm font-medium">
                            <Filter className="mr-2 h-4 w-4" /> Filters:
                        </div>
                        <select
                            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 transition-colors cursor-pointer"
                            value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
                        >
                            <option value="All">All Countries</option>
                            <option value="USA">🇺🇸 USA</option>
                            <option value="UK">🇬🇧 UK</option>
                            <option value="Canada">🇨🇦 Canada</option>
                            <option value="Germany">🇩🇪 Germany</option>
                            <option value="Australia">🇦🇺 Australia</option>
                        </select>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-96 bg-slate-100 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {discovery.map((uni, idx) => {
                                const added = isShortlisted(uni.name!);
                                const labelColor = uni.matchLabel === 'Safe' ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200' :
                                    uni.matchLabel === 'Target' ? 'bg-blue-100/80 text-blue-700 border-blue-200' :
                                        'bg-purple-100/80 text-purple-700 border-purple-200';

                                return (
                                    <div key={idx} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1">
                                        <div className="relative h-48 bg-slate-200 overflow-hidden group-hover:scale-105 transition-transform duration-700">
                                            {/* Image with Fallback */}
                                            {uni.image_url ? (
                                                <img
                                                    src={uni.image_url}
                                                    alt={uni.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.onerror = null;
                                                        target.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop"; // Reliable generic fallback
                                                    }}
                                                />
                                            ) : (
                                                <div className={`w-full h-full bg-gradient-to-br ${idx % 3 === 0 ? 'from-purple-600 via-blue-600 to-indigo-700' :
                                                    idx % 3 === 1 ? 'from-emerald-500 via-teal-600 to-cyan-700' :
                                                        'from-orange-500 via-red-500 to-pink-600'
                                                    }`} />
                                            )}

                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

                                            <div className="absolute bottom-4 left-4 right-4">
                                                <div className="text-white font-bold text-xl leading-tight shadow-sm mb-1">{uni.name}</div>
                                                <div className="flex items-center text-slate-200 text-sm">
                                                    <MapPin className="h-3 w-3 mr-1" /> {uni.country}
                                                </div>
                                            </div>

                                            <div className={`absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm ${labelColor}`}>
                                                {uni.matchLabel?.toUpperCase()} MATCH
                                            </div>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col">
                                            {/* Key Stats */}
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Tuition</div>
                                                    <div className={`font-bold ${uni.costDetails?.affordable ? 'text-emerald-600' : 'text-slate-700'}`}>
                                                        {uni.costDetails?.total}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Acceptance</div>
                                                    <div className="font-bold text-slate-700">{uni.acceptance_rate}%</div>
                                                </div>
                                            </div>

                                            {/* AI Insight */}
                                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 mb-6 flex-1">
                                                <p className="text-sm text-slate-600 italic">
                                                    <Sparkles className="inline-block h-3 w-3 text-blue-400 mr-1" />
                                                    "{uni.fitReason}"
                                                </p>
                                            </div>

                                            <Button
                                                className={`w-full py-6 text-base font-medium shadow-none transition-colors ${added
                                                    ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                                    }`}
                                                disabled={added}
                                                onClick={() => addToShortlist(uni)}
                                            >
                                                {added ? (
                                                    <><CheckCircle className="mr-2 h-5 w-5" /> Shortlisted</>
                                                ) : (
                                                    <><Plus className="mr-2 h-5 w-5" /> Add to Shortlist</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'shortlist' && (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-500">
                    {shortlist.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-slate-900">Your shortlist is empty</h3>
                            <p className="text-slate-500 mb-6">Go to the Explore tab to discover universities.</p>
                            <Button onClick={() => setActiveTab('explore')} variant="outline">
                                Start Exploring
                            </Button>
                        </div>
                    )}
                    {shortlist.map((uni, idx) => {
                        const isLocked = lockedId === uni.id || uni.status === 'locked';
                        const isOtherLocked = lockedId && !isLocked;
                        const data = uni.university_data || {};

                        return (
                            <div key={idx} className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 ${isLocked ? 'ring-2 ring-emerald-500 shadow-xl scale-[1.02]' : 'border-slate-200 hover:shadow-lg hover:-translate-y-1'} ${isOtherLocked ? 'opacity-50 grayscale' : ''}`}>
                                <div className="h-32 bg-slate-800 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 opacity-90" />
                                    {isLocked && (
                                        <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                                            <CheckCircle className="h-3 w-3 mr-1" /> LOCKED CHOICE
                                        </div>
                                    )}
                                    <div className="absolute bottom-4 left-6">
                                        <h3 className="text-white font-bold text-xl">{uni.university_name}</h3>
                                        <div className="flex items-center text-slate-300 text-sm mt-1">
                                            <MapPin className="mr-1 h-3 w-3" /> {data.country || 'International'}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="text-center">
                                            <div className="text-xs text-slate-400 uppercase tracking-wide">Chance</div>
                                            <div className="font-bold text-slate-800">{data.chance || 'N/A'}</div>
                                        </div>
                                        <div className="h-8 w-px bg-slate-100" />
                                        <div className="text-center">
                                            <div className="text-xs text-slate-400 uppercase tracking-wide">Avg Cost</div>
                                            <div className="font-bold text-slate-800">{data.cost || 'Calculate'}</div>
                                        </div>
                                    </div>

                                    {isLocked ? (
                                        <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300" onClick={() => initUnlock(uni.id, uni.university_name!)}>
                                            <Unlock className="mr-2 h-4 w-4" /> Unlock Application
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                                            disabled={!!lockedId}
                                            onClick={() => initLock(uni.id, uni.university_name!)}
                                        >
                                            <Lock className="mr-2 h-4 w-4" /> Lock & Start Applying
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

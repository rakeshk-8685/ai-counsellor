
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Lock, Unlock, MapPin, CheckCircle, Search, Plus, Filter, Sparkles, GraduationCap, Trash2, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../config';

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
    programs?: any;
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
    const [removeModal, setRemoveModal] = useState<{ open: boolean, id: string, name: string }>({ open: false, id: '', name: '' });
    const [isRemoving, setIsRemoving] = useState(false);

    const fetchShortlist = () => {
        fetch(`${API_BASE}/api/universities/shortlist?userId=${user?.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch shortlist');
                return res.json();
            })
            .then(data => {
                const list = data.shortlists || [];
                setShortlist(list);
                const locked = list.find((u: University) => u.status === 'locked');
                if (locked) setLockedId(locked.id);
            })
            .catch(err => {
                console.error('Shortlist fetch error:', err);
                setShortlist([]);
            });
    };

    const fetchDiscovery = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/universities/discover?userId=${user?.id}&country=${filterCountry}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || 'Failed to load'); });
                }
                return res.json();
            })
            .then(data => {
                setDiscovery(data.universities || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Discovery fetch error:', err);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (!user) return;
        fetchShortlist();
        fetchDiscovery();
    }, [user, token, filterCountry]);

    const addToShortlist = async (uni: University) => {
        try {
            await fetch(`${API_BASE}/api/universities/shortlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    userId: user?.id,
                    universityId: uni.id,
                    name: uni.name,
                    country: uni.country,
                    chance: uni.matchLabel,
                    image_url: uni.image_url,
                    cost: uni.costDetails?.total,
                    ranking: uni.ranking,
                    tuition_fee: uni.tuition_fee,
                    acceptance_rate: uni.acceptance_rate,
                    programs: uni.programs
                })
            });
            fetchShortlist();
        } catch (e) {
            console.error(e);
        }
    };

    // Helper to check if already shortlisted
    const isShortlisted = (name: string) => shortlist.some(s => s.university_name === name);

    // Remove from shortlist - Step 1: Show confirmation modal
    const initRemove = (id: string, name: string) => {
        setRemoveModal({ open: true, id, name });
    };

    // Remove from shortlist - Step 2: Confirm and execute
    const confirmRemove = async () => {
        console.log('Removing shortlist item:', removeModal.id, removeModal.name);
        setIsRemoving(true);
        try {
            const url = `${API_BASE}/api/universities/shortlist/${removeModal.id}`;
            console.log('DELETE request to:', url);
            const res = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Response status:', res.status);

            // Check content type to detect HTML responses (API not reachable)
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                console.error('Received HTML response - API not reachable. Check VITE_API_URL configuration.');
                alert('API server not reachable. Please check your API configuration.');
                setIsRemoving(false);
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                console.error('Remove error:', data);
                alert(data.error || 'Failed to remove');
                setIsRemoving(false);
                return;
            }
            // Success - close modal and refresh
            console.log('Remove successful');
            setRemoveModal({ open: false, id: '', name: '' });
            fetchShortlist();
        } catch (e) {
            console.error('Remove exception:', e);
            alert('An error occurred while removing. Please try again.');
        } finally {
            setIsRemoving(false);
        }
    };

    // --- LOCK FLOW ---
    const initLock = (uniId: string, uniName: string) => {
        setLockModal({ open: true, id: uniId, name: uniName });
    };

    const confirmLock = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/universities/lock`, {
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
            const res = await fetch(`${API_BASE}/api/universities/unlock`, {
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

            {/* Remove Confirmation Modal */}
            {removeModal.open && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            {/* Warning Icon */}
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 className="h-8 w-8 text-red-500" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-2">Remove from Shortlist?</h3>
                            <p className="text-slate-600 mb-6">
                                <strong className="text-slate-800">"{removeModal.name}"</strong> will be removed from your shortlist.
                                You can add it back later from the Explore tab.
                            </p>

                            {/* Info Box */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-slate-600">
                                        <p className="font-medium text-slate-700 mb-1">Note:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>This won't affect locked universities</li>
                                            <li>Any notes or preferences won't be saved</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setRemoveModal({ open: false, id: '', name: '' })}
                                    disabled={isRemoving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                    onClick={confirmRemove}
                                    disabled={isRemoving}
                                >
                                    {isRemoving ? (
                                        <span className="flex items-center gap-2">
                                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Removing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Trash2 className="h-4 w-4" />
                                            Remove
                                        </span>
                                    )}
                                </Button>
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
                            <option value="United States">🇺🇸 United States</option>
                            <option value="UK">🇬🇧 UK</option>
                            <option value="Canada">🇨🇦 Canada</option>
                            <option value="Germany">🇩🇪 Germany</option>
                            <option value="Australia">🇦🇺 Australia</option>
                            <option value="Ireland">🇮🇪 Ireland</option>
                            <option value="Singapore">🇸🇬 Singapore</option>
                            <option value="South Korea">🇰🇷 South Korea</option>
                            <option value="Netherlands">🇳🇱 Netherlands</option>
                            <option value="Switzerland">🇨🇭 Switzerland</option>
                            <option value="New Zealand">🇳🇿 New Zealand</option>
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
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Empty State */}
                    {shortlist.length === 0 && (
                        <div className="text-center py-20 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-3xl border border-dashed border-indigo-200">
                            <div className="bg-white w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
                                <GraduationCap className="h-10 w-10 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Your shortlist is empty</h3>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">Explore universities and add your favorites here to compare and track your applications.</p>
                            <Button onClick={() => setActiveTab('explore')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-indigo-200">
                                <Search className="mr-2 h-5 w-5" /> Start Exploring
                            </Button>
                        </div>
                    )}

                    {/* Shortlist Cards Grid - Matching Reference Design */}
                    {shortlist.length > 0 && (
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {shortlist.map((uni, idx) => {
                                const isLocked = lockedId === uni.id || uni.status === 'locked';
                                const isOtherLocked = lockedId && !isLocked;
                                const data = uni.university_data || {};
                                const imageUrl = data.image_url || data.imageUrl || `https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80`;

                                // Determine match type badge
                                const matchType = data.chance || 'Target';
                                const matchBadgeClass = matchType === 'Safe'
                                    ? 'bg-emerald-500'
                                    : matchType === 'Dream'
                                        ? 'bg-purple-500'
                                        : 'bg-blue-500';

                                return (
                                    <div
                                        key={uni.id || idx}
                                        className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500
                                            ${isLocked
                                                ? 'ring-3 ring-emerald-400 shadow-2xl'
                                                : 'hover:shadow-2xl hover:-translate-y-1'
                                            }
                                            ${isOtherLocked ? 'opacity-60 grayscale-[40%]' : ''}
                                        `}
                                        onClick={() => !isLocked && !lockedId && initLock(uni.id, uni.university_name!)}
                                    >
                                        {/* Full Card Image */}
                                        <div className="aspect-[4/3] relative">
                                            <img
                                                src={imageUrl}
                                                alt={uni.university_name || 'University'}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80';
                                                }}
                                            />

                                            {/* Dark Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                                            {/* Match Badge - Top Right */}
                                            <div className={`absolute top-3 right-3 ${matchBadgeClass} text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg`}>
                                                {matchType} Match
                                            </div>

                                            {/* Locked Badge */}
                                            {isLocked && (
                                                <div className="absolute top-3 left-3 bg-white text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg">
                                                    <CheckCircle className="h-3.5 w-3.5" /> LOCKED
                                                </div>
                                            )}

                                            {/* University Info - Bottom */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                <h3 className="text-white font-bold text-lg leading-snug mb-1 drop-shadow-lg">
                                                    {uni.university_name}
                                                </h3>
                                                <div className="flex items-center text-white/90 text-sm gap-1">
                                                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                                    <span>{data.country || 'International'}</span>
                                                </div>
                                            </div>

                                            {/* Remove Button - Bottom Right (Only if not locked) */}
                                            {!isLocked && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); initRemove(uni.id, uni.university_name!); }}
                                                    className="absolute bottom-3 left-3 z-20 bg-white/95 hover:bg-red-50 text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100 flex items-center gap-1.5 border border-slate-200 hover:border-red-200"
                                                    title="Remove from shortlist"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Remove
                                                </button>
                                            )}

                                            {/* Action Overlay on Hover (Only if not locked and no other is locked) */}
                                            {!isLocked && !lockedId && (
                                                <div
                                                    className="absolute inset-0 bg-emerald-600/90 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none z-10"
                                                >
                                                    <div className="text-white text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                        <Lock className="h-8 w-8 mx-auto mb-2" />
                                                        <p className="font-semibold">Click to Lock</p>
                                                        <p className="text-sm text-white/80">& Start Applying</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unlock Button for Locked Cards */}
                                            {isLocked && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); initUnlock(uni.id, uni.university_name!); }}
                                                    className="absolute bottom-4 right-4 bg-white text-red-500 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-red-50 transition-colors shadow-lg"
                                                >
                                                    <Unlock className="h-3.5 w-3.5" /> Unlock
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

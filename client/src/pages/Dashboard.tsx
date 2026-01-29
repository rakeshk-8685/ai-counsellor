import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader2, CheckCircle2, TrendingUp, BookOpen, GraduationCap, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SmartProfile {
    status: string;
    academic_data: any;
    study_goals: any;
    budget: any;
    exams: any;
    // Smart Fields
    strength: { score: number, label: string, missing: string[] };
    stage: { id: number, name: string, progress: number };
    tasks: { id: string, title: string, done: boolean, type?: string, critical?: boolean }[];
}

import ProfileUpdateModal from '../components/ProfileUpdateModal';

export default function Dashboard() {
    const { user, token } = useAuth();
    const [data, setData] = useState<SmartProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

    const fetchData = async () => {
        if (!user || !token) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/profile/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch");
            const resData = await res.json();
            setData(resData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && token) {
            fetchData();
        }
    }, [user, token]);

    // Mock Task Toggle (In real app, this would be an API call)
    const toggleTask = (taskId: string) => {
        // Optimistic Update
        if (!data) return;
        const newTasks = data.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
        setData({ ...data, tasks: newTasks });

        // Creating the "Connected System" feel: 
        // If a critical task is done, re-fetch to see if Stage updates
        setTimeout(() => fetchData(), 500);
    };

    // Handle initial auth load
    if (loading && !data) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-slate-500">Syncing with AI Counsellor...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
                <p className="text-slate-500">Unable to load dashboard data.</p>
                <Button onClick={fetchData} variant="outline">Retry Connection</Button>
            </div>
        )
    }

    // SECTION C: Stage Indicator Logic
    const stages = ["Building Profile", "Discovery", "Finalizing", "Preparing"];

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Command Center</h1>
                    <p className="text-slate-600">AI-Guided Journey for <span className="font-semibold text-indigo-600">{user?.full_name}</span></p>
                </div>
                <Link to="/counsellor">
                    <Button className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all">
                        <Zap className="mr-2 h-4 w-4" /> AI Counsellor
                    </Button>
                </Link>
            </div>

            {/* SECTION C: STAGE ENGINE */}
            <Card className="border-indigo-100 shadow-md">
                <CardContent className="p-8">
                    <div className="mb-6 flex items-end justify-between">
                        <div>
                            <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">Current Phase</span>
                            <h2 className="text-3xl font-bold text-indigo-900 mt-1">{data.stage?.name || 'Loading...'}</h2>
                            <p className="text-sm text-slate-600 mt-1">
                                {data.stage?.name === 'Building Profile' && "We are gathering your data to match you with the best."}
                                {data.stage?.name === 'Discovery' && "Explore universities and simplify your shortlist."}
                            </p>
                        </div>
                        <div className="text-right hidden sm:block">
                            <span className="text-4xl font-bold text-slate-200">{data.stage?.progress || 0}%</span>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="relative h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className="absolute h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-out"
                            style={{ width: `${data.stage?.progress || 0}%` }}
                        ></div>
                    </div>
                    {/* Stage Labels */}
                    <div className="mt-6 grid grid-cols-4 text-center text-xs font-medium text-slate-400">
                        {stages.map((s, i) => {
                            const active = i + 1 === (data.stage?.id || 1);
                            const passed = i + 1 < (data.stage?.id || 1);
                            return (
                                <div key={s} className={`flex flex-col items-center ${active ? 'text-indigo-600' : passed ? 'text-emerald-500' : ''}`}>
                                    <div className={`mb-2 h-3 w-3 rounded-full border-2 ${active ? 'bg-indigo-600 border-indigo-600' : passed ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}></div>
                                    {s}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                {/* SECTION A: DATA SOURCE */}
                <Card className="h-full border-t-4 border-t-slate-400 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <GraduationCap className="h-5 w-5 text-slate-500" />
                            Profile Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg bg-slate-50 p-3 text-sm">
                            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Target</div>
                            <div className="font-semibold text-slate-900">{data.study_goals?.targetDegree || '-'} in {data.study_goals?.targetField || '-'}</div>
                            <div className="text-slate-600">{data.study_goals?.intake || 'No intake set'}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg bg-slate-50 p-3 text-sm">
                                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">GPA</div>
                                <div className="font-semibold text-slate-900">{data.academic_data?.gpa || '-'}</div>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3 text-sm">
                                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Budget</div>
                                <div className="font-semibold text-slate-900">{data.budget?.budgetRange || '-'}</div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full mt-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                            onClick={() => setIsUpdateModalOpen(true)}
                        >
                            Update Data
                        </Button>
                    </CardContent>
                </Card>

                {/* Profile Update Modal */}
                {data && (
                    <ProfileUpdateModal
                        open={isUpdateModalOpen}
                        onOpenChange={setIsUpdateModalOpen}
                        initialData={data}
                        onUpdateSuccess={fetchData} // Refresh dashboard after update
                    />
                )}

                {/* SECTION B: AI INTELLIGENCE */}
                <Card className={`h-full border-t-4 shadow-sm hover:shadow-md transition-shadow ${data.strength.label === 'Strong' ? 'border-t-emerald-500' : data.strength.label === 'Average' ? 'border-t-amber-500' : 'border-t-red-500'}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className={`h-5 w-5 ${data.strength.label === 'Strong' ? 'text-emerald-500' : data.strength.label === 'Average' ? 'text-amber-500' : 'text-red-500'}`} />
                            AI Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-slate-100">
                            <span className="text-2xl font-bold text-slate-900">{data.strength.label}</span>
                            <div className="absolute top-0 text-[10px] bg-slate-900 text-white px-2 rounded-full -mt-2">Score: {data.strength.score}</div>
                        </div>
                        <div className="mt-6 space-y-2 w-full">
                            {data.strength.missing.length > 0 ? (
                                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-100">
                                    <strong>Gap Analysis:</strong>
                                    <ul className="list-disc pl-4 mt-1 space-y-1">
                                        {data.strength.missing.map(m => <li key={m}>Missing: {m}</li>)}
                                    </ul>
                                </div>
                            ) : (
                                <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-100">
                                    <CheckCircle2 className="h-4 w-4 inline mr-1" /> Profile looks solid!
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* SECTION D: ACTION SYSTEM */}
                <Card className="h-full border-t-4 border-t-indigo-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BookOpen className="h-5 w-5 text-indigo-500" />
                            AI To-Do List
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.tasks?.map((task) => (
                                <div
                                    key={task.id}
                                    className={`group flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${task.done ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'}`}
                                    onClick={() => toggleTask(task.id)}
                                >
                                    <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${task.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-indigo-500'}`}>
                                        {task.done && <CheckCircle2 className="h-3 w-3 text-white" />}
                                    </div>
                                    <div>
                                        <p className={`text-sm ${task.done ? 'text-slate-400 line-through' : 'font-medium text-slate-800'}`}>
                                            {task.title}
                                        </p>
                                        {task.critical && !task.done && (
                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Critical</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!data.tasks || data.tasks.length === 0) && <p className="text-sm text-slate-400 italic">No pending tasks for this stage.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

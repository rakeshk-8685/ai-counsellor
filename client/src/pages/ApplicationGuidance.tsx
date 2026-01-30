import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { CheckCircle2, FileText, Calendar, AlertCircle, Lock, ListTodo, Circle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { API_BASE } from '../config';
import { useNavigate } from 'react-router-dom';

interface Task {
    id: string;
    task_name: string;
    category: string;
    status: 'pending' | 'completed';
    priority: string;
    due_date: string;
}

export default function ApplicationGuidance() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [lockedUni, setLockedUni] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);

    const fetchTasks = () => {
        fetch(`${API_BASE}/api/tasks?userId=${user?.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.locked) {
                    setIsLocked(true);
                    setTasks(data.tasks);
                    setLockedUni(data.university);
                } else {
                    setIsLocked(false);
                }
                setLoading(false);
            })
            .catch(_err => setLoading(false));
    };

    useEffect(() => {
        if (!user) return;
        fetchTasks();
    }, [user, token]);

    const toggleTask = async (taskId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
        // Optimistic Update
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

        try {
            await fetch(`${API_BASE}/api/tasks/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ taskId, status: newStatus })
            });
        } catch (e) {
            console.error(e);
            fetchTasks(); // Revert on error
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Loading Guidance...</div>;

    if (!isLocked) {
        return (
            <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="bg-slate-100 p-6 rounded-full mb-6 relative">
                    <div className="absolute inset-0 rounded-full animate-ping bg-slate-200 opacity-75"></div>
                    <Lock className="h-12 w-12 text-slate-400 relative z-10" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Application Guidance is Locked</h1>
                <p className="text-slate-600 max-w-md mb-8">
                    You must <strong>Lock a University</strong> in your shortlist before you can access detailed application steps, timelines, and document checklists.
                </p>
                <Button onClick={() => navigate('/universities')} className="bg-slate-900 text-white hover:bg-slate-800">
                    Go to Shortlist to Lock University
                </Button>
            </div>
        );
    }

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const progress = Math.round((completedTasks.length / tasks.length) * 100) || 0;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-4">
                <div className="bg-emerald-100 p-3 rounded-full">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-xl font-bold text-emerald-900">Application Roadmap: {lockedUni?.university_name}</h2>
                    <p className="text-emerald-700 mt-1">
                        Follow this personalized checklist to maximize your admission chances.
                    </p>
                    {/* Progress Bar */}
                    <div className="mt-4 max-w-lg">
                        <div className="flex justify-between text-xs font-semibold text-emerald-800 mb-1">
                            <span>Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-emerald-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Task Board */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <ListTodo className="h-6 w-6 text-indigo-600" />
                        <h2 className="text-2xl font-bold text-slate-900">Action Items</h2>
                    </div>

                    {/* Pending Tasks */}
                    <div className="space-y-3">
                        {pendingTasks.map((task) => (
                            <div key={task.id} className="group bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-all cursor-pointer" onClick={() => toggleTask(task.id, task.status)}>
                                <div className="mt-1">
                                    <Circle className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{task.task_name}</h4>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {task.priority} Priority
                                        </span>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                            {task.category}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" /> Due: {new Date(task.due_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {pendingTasks.length === 0 && <div className="text-center py-8 text-slate-500 italic">No pending tasks. Great job!</div>}
                    </div>

                    {/* Completed Tasks */}
                    {completedTasks.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-slate-500 font-semibold mb-3 text-sm uppercase tracking-wider">Completed</h3>
                            <div className="space-y-2 opacity-75">
                                {completedTasks.map((task) => (
                                    <div key={task.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center gap-3 cursor-pointer" onClick={() => toggleTask(task.id, task.status)}>
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        <span className="text-slate-500 line-through decoration-slate-400">{task.task_name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="h-5 w-5 text-indigo-500" /> Document Checklist
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <p className="text-slate-500 mb-2">Ensure these are ready before the deadline.</p>
                            {tasks.filter(t => t.category === 'Document').map((t, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    {t.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                                    <span className={t.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}>{t.task_name}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none">
                        <CardContent className="p-6">
                            <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                            <p className="text-indigo-100 text-sm mb-4">
                                Our AI Counsellor can help you review your SOP or suggest edits for your resume.
                            </p>
                            <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => navigate('/counsellor')}>
                                Chat with AI Counsellor
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

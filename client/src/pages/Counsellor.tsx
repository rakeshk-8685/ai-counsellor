import { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { Send, Bot, User as UserIcon, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

// Premium UI Upgrade for Chat
export default function Counsellor() {
    const { user, token, updateUser } = useAuth();
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: `Hi ${user?.full_name}! I'm your AI Counsellor. I've analyzed your profile and I'm ready to help you plan your future. Ask me anything!`, sender: 'ai', timestamp: new Date() }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now(), text: input, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: user?.id, message: userMsg.text })
            });
            const data = await res.json();

            const aiMsg: Message = { id: Date.now() + 1, text: data.reply, sender: 'ai', timestamp: new Date() };
            setMessages(prev => [...prev, aiMsg]);

            // Auto-Refresh Context if System Action detected
            if (data.reply.includes('[System:')) {
                // Fetch fresh progress
                const pRes = await fetch(`http://localhost:5000/api/progress/${user?.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (pRes.ok) {
                    const newProgress = await pRes.json();
                    updateUser({ progress: newProgress });
                }
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { id: Date.now(), text: "Sorry, I'm having trouble connecting right now.", sender: 'ai', timestamp: new Date() }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-4xl px-4 py-6 h-[calc(100vh-64px)] flex flex-col">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/dashboard')} className="hover:bg-slate-100 rounded-full h-10 w-10 p-0 flex items-center justify-center">
                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">AI Counsellor</h1>
                    </div>
                </div>
                {/* Complete Session Action */}
                <Button
                    onClick={async () => {
                        if (confirm("Are you satisfied with the counselling session? This will unlock university shortlisting.")) {
                            try {
                                await fetch('http://localhost:5000/api/progress/complete-counsellor', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ userId: user?.id })
                                });
                                alert("Session Completed! Unlocking Universities...");
                                navigate('/dashboard'); // Go back to dashboard to see unlocked stage
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-full px-6"
                >
                    <CheckCircle className="mr-2 h-4 w-4" /> Complete Session
                </Button>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-2xl shadow-indigo-500/10 rounded-3xl bg-white/80 backdrop-blur-xl">
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white to-slate-50/50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-md ${msg.sender === 'user' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-white text-emerald-600 border border-emerald-100'}`}>
                                    {msg.sender === 'user' ? <UserIcon className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
                                </div>
                                <div className={`rounded-2xl px-5 py-3 shadow-sm ${msg.sender === 'user'
                                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-md'
                                    }`}>
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                                    <span className={`text-[10px] block mt-2 font-medium ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start animate-pulse">
                            <div className="flex gap-3">
                                <div className="h-10 w-10 rounded-full bg-white border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-md">
                                    <Bot className="h-6 w-6" />
                                </div>
                                <div className="bg-white rounded-2xl rounded-tl-none px-5 py-4 shadow-md border border-slate-100 flex items-center gap-1.5">
                                    <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                    <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white/90 backdrop-blur-md border-t border-slate-100">
                    <form onSubmit={handleSend} className="flex gap-3 relative">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about universities, scholarships, or advice..."
                            className="flex-1 h-14 pl-6 pr-14 rounded-full border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-inner transition-all"
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="absolute right-2 top-2 h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 p-0 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-slate-400">AI can make mistakes. Verify important info.</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

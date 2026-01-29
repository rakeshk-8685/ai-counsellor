import { ArrowRight, Compass, Sparkles, Target } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
    const { user } = useAuth();
    return (
        <div className="flex flex-col gap-20 pb-20">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-white pt-20 pb-32 lg:pt-32">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="container relative mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mb-6">
                            AI-Powered University Guidance
                        </span>
                        <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl">
                            From <span className="text-indigo-600">Confusion</span> to <span className="text-emerald-500">Clarity</span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                            Navigate your study abroad journey with precision. Our AI counsellor analyzes your profile to match you with your dream universities.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link to={user ? "/dashboard" : "/onboarding"}>
                                <Button size="lg" className="rounded-full px-8 text-lg">
                                    {user ? "Go to Dashboard" : "Start Your Journey"} <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-4 -mt-20 relative z-10">
                <div className="grid gap-8 md:grid-cols-3">
                    <Card className="border-0 shadow-xl shadow-indigo-100 bg-white/50 backdrop-blur-sm hover:translate-y-[-5px] transition-all duration-300">
                        <CardHeader>
                            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30 text-white">
                                <Target className="h-7 w-7" />
                            </div>
                            <CardTitle className="text-xl">Personalized Matching</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 leading-relaxed">
                                Forget generic lists. Get university recommendations tailored to your grades, budget, and career aspirations.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl shadow-emerald-100 bg-white/50 backdrop-blur-sm hover:translate-y-[-5px] transition-all duration-300">
                        <CardHeader>
                            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 text-white">
                                <Compass className="h-7 w-7" />
                            </div>
                            <CardTitle className="text-xl">Step-by-Step Guidance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 leading-relaxed">
                                A structured path from "I don't know where to start" to "Application Sent". We walk you through every milestone.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-xl shadow-purple-100 bg-white/50 backdrop-blur-sm hover:translate-y-[-5px] transition-all duration-300">
                        <CardHeader>
                            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 shadow-lg shadow-purple-500/30 text-white">
                                <Sparkles className="h-7 w-7" />
                            </div>
                            <CardTitle className="text-xl">AI Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 leading-relaxed">
                                Leverage Gemini AI to analyze your essay drafts and predict your acceptance chances with data-driven insights.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}

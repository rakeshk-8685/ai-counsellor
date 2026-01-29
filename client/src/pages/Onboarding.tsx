import { useState, useEffect } from 'react';
// import { useWizard } from 'react-use-wizard';
import { Button } from '../components/ui/Button';
import AcademicStep from './onboarding-steps/AcademicStep';
import StudyGoalStep from './onboarding-steps/StudyGoalStep';
import BudgetStep from './onboarding-steps/BudgetStep';
import ExamsStep from './onboarding-steps/ExamsStep';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

const ProfileWizard = () => {
    // const { previousStep, nextStep, isLastStep, isFirstStep, activeStep } = useWizard();
    const [activeStep, setActiveStep] = useState(0);
    const stepsCount = 4;

    const nextStep = () => setActiveStep(prev => Math.min(prev + 1, stepsCount - 1));
    const previousStep = () => setActiveStep(prev => Math.max(prev - 1, 0));
    const isFirstStep = activeStep === 0;
    const isLastStep = activeStep === stepsCount - 1;

    const navigate = useNavigate();
    const { user, token, updateUser } = useAuth();

    useEffect(() => {
        if (user?.progress?.onboarding_completed) {
            navigate('/dashboard');
        }
    }, [user, navigate]);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        // Academic
        currentDegree: '', major: '', gpa: '', gradYear: '',
        // Goals
        targetDegree: '', targetField: '', intake: '', countries: '',
        // Budget
        budgetRange: '', fundingSource: '',
        // Exams
        ieltsScore: '', greScore: '', sopStatus: ''
    });

    const updateData = (newData: any) => {
        setFormData(prev => ({ ...prev, ...newData }));
    };

    const saveStepInfo = async (stepIndex: number) => {
        setIsLoading(true);
        const sections = ['academic', 'goals', 'budget', 'exams'];
        const sectionName = sections[stepIndex];

        // Map flat formData to nested structure expected by API
        let payload = {};
        if (sectionName === 'academic') {
            payload = { currentDegree: formData.currentDegree, major: formData.major, gpa: formData.gpa, gradYear: formData.gradYear };
        } else if (sectionName === 'goals') {
            payload = { targetDegree: formData.targetDegree, targetField: formData.targetField, intake: formData.intake, countries: formData.countries };
        } else if (sectionName === 'budget') {
            payload = { budgetRange: formData.budgetRange, fundingSource: formData.fundingSource };
        } else if (sectionName === 'exams') {
            payload = { ieltsScore: formData.ieltsScore, greScore: formData.greScore, sopStatus: formData.sopStatus };
        }

        try {
            const res = await fetch(`${API_BASE}/api/profile/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user?.id,
                    section: sectionName,
                    data: payload
                })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Failed to save: ${text}`);
            }
            await res.json();
        } catch (e) {
            console.error("Save error", e);
            throw e; // Rethrow to stop navigation
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = async () => {
        try {
            await saveStepInfo(activeStep);

            if (isLastStep) {
                setIsLoading(true);
                // Call Progress API to mark complete
                const res = await fetch(`${API_BASE}/api/progress/complete-onboarding`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ userId: user?.id })
                });

                if (!res.ok) {
                    const text = await res.text();
                    console.error("API Error Response:", res.status, text);
                    try {
                        const errData = JSON.parse(text);
                        throw new Error(errData.error || `Server Error: ${res.status}`);
                    } catch (e) {
                        throw new Error(`Server returned HTML (Status ${res.status}). Check Backend Console.`);
                    }
                }

                const progressData = await res.json();

                // Update Local Context so StageGuard handles it correctly
                updateUser({ progress: progressData });

                // Force navigation
                window.location.href = '/dashboard'; // Hard navigation to ensure state clear
                // navigate('/dashboard'); 
            } else {
                nextStep();
            }
        } catch (e: any) {
            console.error("Completion error", e);
            alert(`Error: ${e.message}\n\nPlease try refreshing the page or checking your connection.`);
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        <AcademicStep key="academic" data={formData} updateData={updateData} />,
        <StudyGoalStep key="goals" data={formData} updateData={updateData} />,
        <BudgetStep key="budget" data={formData} updateData={updateData} />,
        <ExamsStep key="exams" data={formData} updateData={updateData} />
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Step Indicators (Premium) */}
            <div className="mb-8">
                <div className="flex justify-between items-center relative">
                    {/* Progress Line */}
                    <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-slate-100 rounded-full z-0"></div>
                    <div
                        className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-indigo-600 rounded-full z-0 transition-all duration-500 ease-out"
                        style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                    ></div>

                    {[0, 1, 2, 3].map((step) => {
                        const isActive = step === activeStep;
                        const isCompleted = step < activeStep;

                        return (
                            <div key={step} className="relative z-10 flex flex-col items-center">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 font-bold ${isActive ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110' : isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-400'}`}>
                                    {isCompleted ? <Check className="h-5 w-5" /> : step + 1}
                                </div>
                                <span className={`mt-2 text-xs font-semibold uppercase tracking-wide ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {['Academic', 'Goals', 'Budget', 'Exams'][step]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 min-h-[400px]">
                {steps[activeStep]}
            </div>

            <div className="mt-8 flex justify-between pt-6 border-t border-slate-100">
                <Button
                    variant="outline"
                    onClick={() => previousStep()}
                    disabled={isFirstStep || isLoading}
                    className="hover:border-slate-300"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                <Button
                    onClick={handleNext}
                    isLoading={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                >
                    {isLastStep ? (
                        <>Complete Application <Check className="ml-2 h-4 w-4" /></>
                    ) : (
                        <>Next Step <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default function Onboarding() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 lg:py-20 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-200/50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute top-40 -right-20 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="container mx-auto max-w-4xl px-4 relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-900">Let's Build Your Profile</h1>
                    <p className="text-slate-600 mt-2">Help our AI understand your unique journey.</p>
                </div>

                <div className="rounded-3xl border border-white/50 bg-white/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl shadow-indigo-500/10">
                    <ProfileWizard />
                </div>
            </div>
        </div>
    );
}

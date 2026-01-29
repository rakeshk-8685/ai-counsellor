import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import AcademicStep from '../pages/onboarding-steps/AcademicStep';
import StudyGoalStep from '../pages/onboarding-steps/StudyGoalStep';
import BudgetStep from '../pages/onboarding-steps/BudgetStep';
import ExamsStep from '../pages/onboarding-steps/ExamsStep';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowRight, Check, ArrowLeft } from 'lucide-react';

interface ProfileUpdateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: any;
    onUpdateSuccess: () => void;
}

export default function ProfileUpdateModal({ open, onOpenChange, initialData, onUpdateSuccess }: ProfileUpdateModalProps) {
    const { user, token } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Normalize initialData to flat formData structure used by Steps
    const [formData, setFormData] = useState({
        // Academic
        currentDegree: initialData?.academic_data?.currentDegree || '',
        major: initialData?.academic_data?.major || '',
        gpa: initialData?.academic_data?.gpa || '',
        gradYear: initialData?.academic_data?.gradYear || '',
        // Goals
        targetDegree: initialData?.study_goals?.targetDegree || '',
        targetField: initialData?.study_goals?.targetField || '',
        intake: initialData?.study_goals?.intake || '',
        countries: initialData?.study_goals?.countries || '',
        // Budget
        budgetRange: initialData?.budget?.budgetRange || '',
        fundingSource: initialData?.budget?.fundingSource || '',
        // Exams
        ieltsScore: initialData?.exams?.ieltsScore || '',
        greScore: initialData?.exams?.greScore || '',
        sopStatus: initialData?.exams?.sopStatus || ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                currentDegree: initialData?.academic_data?.currentDegree || '',
                major: initialData?.academic_data?.major || '',
                gpa: initialData?.academic_data?.gpa || '',
                gradYear: initialData?.academic_data?.gradYear || '',
                targetDegree: initialData?.study_goals?.targetDegree || '',
                targetField: initialData?.study_goals?.targetField || '',
                intake: initialData?.study_goals?.intake || '',
                countries: initialData?.study_goals?.countries || '',
                budgetRange: initialData?.budget?.budgetRange || '',
                fundingSource: initialData?.budget?.fundingSource || '',
                ieltsScore: initialData?.exams?.ieltsScore || '',
                greScore: initialData?.exams?.greScore || '',
                sopStatus: initialData?.exams?.sopStatus || ''
            });
        }
    }, [initialData]);

    const updateFormData = (newData: any) => {
        setFormData(prev => ({ ...prev, ...newData }));
    };

    const steps = [
        { id: 'academic', label: 'Academic', component: <AcademicStep data={formData} updateData={updateFormData} /> },
        { id: 'goals', label: 'Goals', component: <StudyGoalStep data={formData} updateData={updateFormData} /> },
        { id: 'budget', label: 'Budget', component: <BudgetStep data={formData} updateData={updateFormData} /> },
        { id: 'exams', label: 'Readiness', component: <ExamsStep data={formData} updateData={updateFormData} /> },
    ];

    const isLastStep = currentStep === steps.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            handleSave();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(0, prev - 1));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const stepId = steps[currentStep].id;
            let payload = {};

            if (stepId === 'academic') {
                payload = { currentDegree: formData.currentDegree, major: formData.major, gpa: formData.gpa, gradYear: formData.gradYear };
            } else if (stepId === 'goals') {
                payload = { targetDegree: formData.targetDegree, targetField: formData.targetField, intake: formData.intake, countries: formData.countries };
            } else if (stepId === 'budget') {
                payload = { budgetRange: formData.budgetRange, fundingSource: formData.fundingSource };
            } else if (stepId === 'exams') {
                payload = { ieltsScore: formData.ieltsScore, greScore: formData.greScore, sopStatus: formData.sopStatus };
            }

            const res = await fetch('http://localhost:5000/api/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user?.id,
                    section: stepId,
                    data: payload
                })
            });

            if (!res.ok) throw new Error("Failed to update");

            if (isLastStep) {
                onUpdateSuccess();
                onOpenChange(false);
            } else {
                setCurrentStep(prev => prev + 1);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Update Profile - Step {currentStep + 1} of {steps.length}</DialogTitle>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex gap-2 mb-6 border-b border-slate-100 pb-4 overflow-x-auto">
                    {steps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isCompleted = index < currentStep;
                        return (
                            <div key={step.id} className="flex flex-col items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-colors ${isActive ? 'bg-indigo-600 text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider font-semibold ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{step.label}</span>
                            </div>
                        )
                    })}
                </div>

                <div className="min-h-[300px]">
                    {steps[currentStep].component}
                </div>

                <div className="flex justify-between pt-6 border-t border-slate-100 mt-6 md:gap-3">
                    <Button
                        variant="outline"
                        onClick={currentStep === 0 ? () => onOpenChange(false) : handleBack}
                        disabled={loading}
                    >
                        {currentStep === 0 ? "Cancel" : <><ArrowLeft className="mr-2 h-4 w-4" /> Back</>}
                    </Button>

                    <Button
                        onClick={isLastStep ? handleSave : handleNext}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLastStep ? "Save & Finish" : "Next Step"}
                        {!isLastStep && !loading && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

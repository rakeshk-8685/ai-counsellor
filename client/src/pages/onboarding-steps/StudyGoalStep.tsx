import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';

interface GoalData {
    targetDegree: string;
    targetField: string;
    intake: string;
    countries: string;
}

interface StepProps {
    data: GoalData;
    updateData: (data: Partial<GoalData>) => void;
}

export default function StudyGoalStep({ data, updateData }: StepProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Study Goals</h2>
                <p className="text-slate-500">What are you looking to pursue?</p>
            </div>

            <div className="grid gap-6">
                <div className="space-y-2">
                    <Label htmlFor="targetDegree" className="text-slate-700 font-medium">Target Degree</Label>
                    <div className="relative">
                        <select
                            id="targetDegree"
                            className="flex h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm transition-all hover:border-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            value={data.targetDegree}
                            onChange={(e) => updateData({ targetDegree: e.target.value })}
                        >
                            <option value="">Select Degree...</option>
                            <option value="Bachelor's">Bachelor's</option>
                            <option value="Master's">Master's</option>
                            <option value="MBA">MBA</option>
                            <option value="PhD">PhD</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="targetField" className="text-slate-700 font-medium">Target Field of Study</Label>
                    <Input
                        id="targetField"
                        className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
                        placeholder="e.g. Data Science, Marketing, Biotech"
                        value={data.targetField}
                        onChange={(e) => updateData({ targetField: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="intake" className="text-slate-700 font-medium">Target Intake</Label>
                        <div className="relative">
                            <select
                                id="intake"
                                className="flex h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm transition-all hover:border-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                value={data.intake}
                                onChange={(e) => updateData({ intake: e.target.value })}
                            >
                                <option value="">Select...</option>
                                <option value="Fall 2025">Fall 2025</option>
                                <option value="Spring 2026">Spring 2026</option>
                                <option value="Fall 2026">Fall 2026</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="countries" className="text-slate-700 font-medium">Preferred Countries</Label>
                    <Input
                        id="countries"
                        className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
                        placeholder="e.g. USA, UK, Canada"
                        value={data.countries}
                        onChange={(e) => updateData({ countries: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
}

import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';

interface AcademicData {
    currentDegree: string;
    major: string;
    gpa: string;
    gradYear: string;
}

interface StepProps {
    data: AcademicData;
    updateData: (data: Partial<AcademicData>) => void;
}

export default function AcademicStep({ data, updateData }: StepProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Background</h2>
                <p className="text-slate-500">Tell us about your current education to help us find the best fit.</p>
            </div>

            <div className="grid gap-6">
                <div className="space-y-2">
                    <Label htmlFor="currentDegree" className="text-slate-700 font-medium">Current/Latest Degree</Label>
                    <div className="relative">
                        <select
                            id="currentDegree"
                            className="flex h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm transition-all hover:border-indigo-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            value={data.currentDegree}
                            onChange={(e) => updateData({ currentDegree: e.target.value })}
                        >
                            <option value="">Select Qualification...</option>
                            <option value="High School">High School (12th Grade)</option>
                            <option value="Bachelor's">Bachelor's Degree</option>
                            <option value="Master's">Master's Degree</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="major" className="text-slate-700 font-medium">Major / Stream</Label>
                    <Input
                        id="major"
                        className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
                        placeholder="e.g. Computer Science, Mechanical Engineering, Commerce"
                        value={data.major}
                        onChange={(e) => updateData({ major: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="gpa" className="text-slate-700 font-medium">GPA / Percentage</Label>
                            <span className="text-xs text-slate-400 mt-1">Convert to 4.0 scale if possible</span>
                        </div>
                        <Input
                            id="gpa"
                            className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
                            placeholder="e.g. 3.8"
                            value={data.gpa}
                            onChange={(e) => updateData({ gpa: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gradYear" className="text-slate-700 font-medium">Graduation Year</Label>
                        <Input
                            id="gradYear"
                            className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10"
                            placeholder="e.g. 2024"
                            value={data.gradYear}
                            onChange={(e) => updateData({ gradYear: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';

interface ExamsData {
    ieltsScore: string;
    greScore: string;
    sopStatus: string;
}

interface StepProps {
    data: ExamsData;
    updateData: (data: Partial<ExamsData>) => void;
}

export default function ExamsStep({ data, updateData }: StepProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Standardized Tests & SOP</h2>
                <p className="text-slate-500">Scores define your strength. Be honest!</p>
            </div>

            <div className="grid gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="ielts" className="text-slate-700 font-medium">IELTS / TOEFL Score</Label>
                        <Input
                            id="ielts"
                            className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 placeholder:text-slate-400"
                            placeholder="e.g. 7.5 or 100"
                            value={data.ieltsScore}
                            onChange={(e) => updateData({ ieltsScore: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gre" className="text-slate-700 font-medium">GRE / GMAT (Optional)</Label>
                        <Input
                            id="gre"
                            className="h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 placeholder:text-slate-400"
                            placeholder="e.g. 320"
                            value={data.greScore}
                            onChange={(e) => updateData({ greScore: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-slate-700 font-medium">Statement of Purpose (SOP) Status</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {['Not Started', 'Drafting', 'Ready'].map((status) => {
                            // Normalize 'Drafting' to 'Draft' for backend consistency if needed
                            const backendValue = status === 'Drafting' ? 'Draft' : status;
                            const isSelected = data.sopStatus === backendValue;
                            return (
                                <div
                                    key={status}
                                    className={`cursor-pointer rounded-xl border-2 px-4 py-3 text-center transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'}`}
                                    onClick={() => updateData({ sopStatus: backendValue })}
                                >
                                    {status}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

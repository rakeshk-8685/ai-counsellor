import { Label } from '../../components/ui/Label';
import { DollarSign, Wallet, PiggyBank, Building } from 'lucide-react';

interface BudgetData {
    budgetRange: string;
    fundingSource: string;
}

interface StepProps {
    data: BudgetData;
    updateData: (data: Partial<BudgetData>) => void;
}

export default function BudgetStep({ data, updateData }: StepProps) {
    const fundingOptions = [
        { id: 'Self-Funded', label: 'Self Funded', icon: Wallet },
        { id: 'Scholarship', label: 'Scholarship Dependent', icon: PiggyBank },
        { id: 'Loan', label: 'Loan Dependent', icon: Building },
    ];

    const ranges = [
        "< $20k / year",
        "$20k - $40k / year",
        "$40k - $60k / year",
        "> $60k / year"
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Planning</h2>
                <p className="text-slate-500">Helping us match universities within your means.</p>
            </div>

            <div className="space-y-6">
                {/* Budget Range */}
                <div className="space-y-3">
                    <Label className="text-slate-700 font-medium">Budget Range (Per Year)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ranges.map((range) => (
                            <div
                                key={range}
                                className={`cursor-pointer flex items-center p-3 rounded-xl border-2 transition-all ${data.budgetRange === range ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold' : 'border-slate-200 hover:border-indigo-300 text-slate-600'}`}
                                onClick={() => updateData({ budgetRange: range })}
                            >
                                <div className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full ${data.budgetRange === range ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                {range}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Funding Source */}
                <div className="space-y-3">
                    <Label className="text-slate-700 font-medium">Primary Funding Source</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {fundingOptions.map((opt) => (
                            <div
                                key={opt.id}
                                className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center h-32 ${data.fundingSource === opt.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md transform scale-[1.02]' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:shadow-sm'}`}
                                onClick={() => updateData({ fundingSource: opt.id })}
                            >
                                <opt.icon className={`h-8 w-8 mb-2 ${data.fundingSource === opt.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className="font-semibold text-sm">{opt.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

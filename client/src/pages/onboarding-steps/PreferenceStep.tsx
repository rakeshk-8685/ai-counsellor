import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';

interface PreferenceData {
    budget: string;
    preferredCountries: string;
}

interface StepProps {
    data: PreferenceData;
    updateData: (data: Partial<PreferenceData>) => void;
}

export default function PreferenceStep({ data, updateData }: StepProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Preferences</h2>
                <p className="text-slate-500">Narrow down your perfect match.</p>
            </div>

            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="countries">Preferred Countries (Comma separated)</Label>
                    <Input
                        id="countries"
                        placeholder="USA, Canada, UK"
                        value={data.preferredCountries}
                        onChange={(e) => updateData({ preferredCountries: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="budget">Max Annual Budget ($USD)</Label>
                    <Input
                        id="budget"
                        type="number"
                        placeholder="30000"
                        value={data.budget}
                        onChange={(e) => updateData({ budget: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
}

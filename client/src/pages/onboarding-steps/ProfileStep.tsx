import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';

interface ProfileData {
    fullName: string;
    email: string;
    country: string;
    targetDegree: string;
}

interface StepProps {
    data: ProfileData;
    updateData: (data: Partial<ProfileData>) => void;
}

export default function ProfileStep({ data, updateData }: StepProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Tell us about yourself</h2>
                <p className="text-slate-500">We need some basic details to personalize your journey.</p>
            </div>

            <div className="grid gap-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={data.fullName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData({ fullName: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={data.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData({ email: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="country">Current Country</Label>
                        <Input
                            id="country"
                            placeholder="India"
                            value={data.country}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData({ country: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="degree">Target Degree</Label>
                        <select
                            id="degree"
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={data.targetDegree}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateData({ targetDegree: e.target.value })}
                        >
                            <option value="">Select...</option>
                            <option value="bachelors">Bachelor's</option>
                            <option value="masters">Master's</option>
                            <option value="phd">PhD</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

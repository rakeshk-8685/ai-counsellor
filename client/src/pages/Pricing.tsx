import { Check } from 'lucide-react';
import { Button } from '../components/ui/Button';

const plans = [
    {
        name: "Free Starter",
        price: "$0",
        description: "Perfect for exploring basic university options.",
        features: [
            "Basic Profile Building",
            "University Discovery (Top 10)",
            "Limited AI Chat (5 queries/day)",
            "Community Support"
        ],
        cta: "Current Plan",
        popular: false
    },
    {
        name: "Pro Scholar",
        price: "$49",
        period: "/month",
        description: "Unlock full AI power and application guidance.",
        features: [
            "Advanced Profile Strength Analysis",
            "Unlimited AI Counsellor Chat",
            "Full University Shortlisting & Locking",
            "Step-by-Step Application Guidance",
            "SOP & Essay AI assistant",
            "Scholarship Matching"
        ],
        cta: "Upgrade to Pro",
        popular: true
    }
];

export default function Pricing() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">Invest in Your Future</h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Choose the plan that fits your ambition. From exploration to acceptance, we have you covered.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plans.map((plan, idx) => (
                    <div key={idx} className={`relative rounded-2xl p-8 ${plan.popular ? 'bg-white shadow-xl ring-2 ring-indigo-600' : 'bg-slate-50 border border-slate-200'}`}>
                        {plan.popular && (
                            <span className="absolute top-0 transform -translate-y-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Most Popular
                            </span>
                        )}
                        <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                        <div className="mt-4 flex items-baseline text-slate-900">
                            <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                            {plan.period && <span className="ml-1 text-xl font-semibold text-slate-500">{plan.period}</span>}
                        </div>
                        <p className="mt-2 text-slate-500">{plan.description}</p>
                        <ul className="mt-6 space-y-4">
                            {plan.features.map((feature, fIdx) => (
                                <li key={fIdx} className="flex">
                                    <Check className="flex-shrink-0 h-5 w-5 text-indigo-500" />
                                    <span className="ml-3 text-slate-500">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-8">
                            <Button
                                className={`w-full ${plan.popular ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-800 hover:bg-slate-900'}`}
                            >
                                {plan.cta}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

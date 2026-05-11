import { Database, BarChart3, Thermometer, Scale } from 'lucide-react';

const challenges = [
    {
        icon: Database,
        title: 'Breaking data silos. Standardizing global operations',
        desc: 'A study of 2,000 global companies found that digital solutions can boost revenues by up to 25% and cut costs by up to 28% compared to the baseline.',
    },
    {
        icon: BarChart3,
        title: 'Sourcing: yield, quality & predictability',
        desc: 'Globally, 30–50% production forecast errors hurt the top line.',
    },
    {
        icon: Thermometer,
        title: 'Model climate change to reduce production losses',
        desc: 'Agri-enterprises reported revenue losses of 2–8% over the past 5–10 years.',
    },
    {
        icon: Scale,
        title: 'Solve compliance challenges: EUDR, food security & sustainability',
        desc: 'Navigate complex regulatory landscapes while maintaining sustainable and traceable supply chains globally.',
    },
];

export default function ChallengesSection() {
    return (
        <section className="py-20 bg-[#F9FAFB]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl md:text-3xl font-bold text-[#0D1B2A] text-center mb-12">
                    Challenges we solve for our customers globally
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {challenges.map((c, i) => (
                        <div
                            key={i}
                            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
                        >
                            <div className="w-12 h-12 rounded-xl bg-[#F0FAF7] flex items-center justify-center mb-4">
                                <c.icon className="w-6 h-6 text-[#1A9E6E]" />
                            </div>
                            <h3 className="font-semibold text-[#0D1B2A] text-sm mb-3 leading-snug">{c.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{c.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
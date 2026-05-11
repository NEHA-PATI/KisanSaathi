import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import AnimatedSection from '../components/shared/AnimatedSection';

const industries = [
    {
        id: 'seed',
        tag: 'Seed & Trait',
        title: 'Accelerate seed production, research, and field operations',
        desc: 'Digitize seed production workflows, manage trial plots, track variety performance, and generate compliance-ready documentation across global seed programs.',
        bullets: ['Trial plot management & geo-tagging', 'Variety performance tracking', 'Field data digitization', 'Production forecasting', 'Compliance reporting'],
        img: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/e5c95108a_generated_1115053f.png',
        reverse: false,
    },
    {
        id: 'food',
        tag: 'Food & Beverage',
        title: 'Ensure consistent raw material quality and supply predictability',
        desc: 'Transform agricultural sourcing for food & beverage companies with intelligent supplier management, demand forecasting, and real-time crop quality monitoring.',
        bullets: ['Supplier performance management', 'Raw material quality tracking', 'Demand and yield forecasting', 'Farm-to-factory traceability', 'Sustainable sourcing certification'],
        img: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/e0cf675ff_generated_206998ce.png',
        reverse: true,
    },
    {
        id: 'finance',
        tag: 'AgriFinance & Insurance',
        title: 'Transform agricultural lending and insurance with AI intelligence',
        desc: 'Plot-level satellite intelligence, crop monitoring, and risk assessment models that enable financial institutions to make data-driven agricultural lending and insurance decisions.',
        bullets: ['Satellite-based crop monitoring for underwriting', 'Yield prediction for loan sizing', 'Climate risk and loss assessment', 'Farmer credit scoring', 'Automated claims verification'],
        img: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/87c5f161e_generated_02f94e3f.png',
        reverse: false,
    },
    {
        id: 'government',
        tag: 'Government & Development',
        title: 'Enable data-driven agricultural policy and farmer welfare programs',
        desc: 'Empower government agencies and development organizations with regional intelligence, farmer registry management, and subsidy optimization to maximize impact.',
        bullets: ['National farmer registry management', 'Subsidy targeting and verification', 'Regional crop production monitoring', 'Disaster relief coordination', 'Policy impact measurement'],
        img: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/be716bdcc_generated_33cf2246.png',
        reverse: true,
    },
];

export default function Industry() {
    return (
        <div className="pt-[108px]">
            {/* Hero */}
            <section className="relative py-20 bg-[#0D1B2A] overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <img src="https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/7affef9a0_generated_0dc0da7b.png" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <span className="inline-block px-4 py-1.5 bg-[#1A9E6E]/20 text-[#2DD4BF] text-sm font-semibold rounded-full mb-5">Industry</span>
                        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-5">
                            Powering every segment of the agri-food value chain
                        </h1>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                            From seed companies to governments, BhoomiAI delivers AI-powered intelligence tailored to your specific industry needs.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Alternating industry sections */}
            {industries.map((ind, i) => (
                <section key={ind.id} id={ind.id} className={`py-20 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className={`grid lg:grid-cols-2 gap-14 items-center`}>
                            <AnimatedSection className={ind.reverse ? 'lg:order-2' : ''}>
                                <span className="inline-block px-3 py-1 bg-[#F0FAF7] text-[#1A9E6E] text-xs font-semibold rounded-full mb-4 uppercase tracking-wide">
                                    {ind.tag}
                                </span>
                                <h2 className="text-2xl md:text-3xl font-bold text-[#0D1B2A] leading-tight mb-4">{ind.title}</h2>
                                <p className="text-gray-500 leading-relaxed mb-6">{ind.desc}</p>
                                <ul className="space-y-2.5 mb-7">
                                    {ind.bullets.map((b, j) => (
                                        <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600">
                                            <CheckCircle2 className="w-4 h-4 text-[#1A9E6E] flex-shrink-0 mt-0.5" />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/contact" className="inline-flex items-center gap-1.5 text-[#1A9E6E] font-semibold text-sm hover:underline">
                                    Learn more <ArrowRight className="w-4 h-4" />
                                </Link>
                            </AnimatedSection>
                            <AnimatedSection delay={0.15} className={ind.reverse ? 'lg:order-1' : ''}>
                                <img src={ind.img} alt={ind.title} className="w-full rounded-2xl shadow-xl object-cover" style={{ maxHeight: 360 }} />
                            </AnimatedSection>
                        </div>
                    </div>
                </section>
            ))}

            {/* Crops coverage bar */}
            <section className="py-14 bg-[#1A9E6E]">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Covering 350+ crops across the globe</h2>
                    <p className="text-white/80 mb-8">From staple grains to specialty cash crops, our AI models cover the full spectrum of global agriculture.</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {['Rice', 'Wheat', 'Maize', 'Coffee', 'Tea', 'Cocoa', 'Soybean', 'Cotton', 'Sugarcane', 'Tomato', 'Potato', 'Banana', 'Mango', 'Groundnut', 'Mustard', 'Chickpea'].map((c) => (
                            <span key={c} className="px-4 py-1.5 bg-white/15 text-white text-sm rounded-full border border-white/20">{c}</span>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
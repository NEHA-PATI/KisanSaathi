import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import AnimatedSection from '../components/shared/AnimatedSection';

const solutions = [
    {
        id: 'supply-chain',
        tag: 'Supply Chain Efficiency',
        title: 'From farm to fork — complete supply chain visibility and resilience',
        desc: 'Optimize your agricultural supply chain with real-time visibility, predictive analytics, and intelligent sourcing recommendations to eliminate inefficiencies and reduce costs.',
        bullets: ['End-to-end farm-to-fork traceability', 'Demand forecasting & inventory optimization', 'Supplier risk scoring & assessment', 'Quality assurance automation', 'EUDR and regulatory compliance'],
        img: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/e0cf675ff_generated_206998ce.png',
        reverse: false,
    },
    {
        id: 'yield',
        tag: 'Yield & Quality Improvement',
        title: 'AI-driven recommendations for maximum yield and quality',
        desc: 'Leverage plot-level intelligence, satellite monitoring, and AI models to provide precise recommendations for optimal planting, irrigation, fertilization, and harvest timing.',
        bullets: ['Plot-level crop health monitoring', 'AI-powered agronomic advisory', 'Precision input management', 'Pest & disease early detection', 'Harvest timing optimization'],
        img: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/fd6ab3603_generated_dd446721.png',
        reverse: true,
    },
    {
        id: 'climate',
        tag: 'Building Climate Resilience',
        title: 'Build resilience against climate volatility and production risk',
        desc: 'Advanced weather modeling, crop stress detection, and adaptive farming recommendations to help agribusinesses navigate an unpredictable climate future.',
        bullets: ['Climate risk modeling & scenario planning', 'Extreme weather early warning systems', 'Adaptive crop & variety selection', 'Water stress and drought monitoring', 'Historical climate pattern analysis'],
        img: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/87c5f161e_generated_02f94e3f.png',
        reverse: false,
    },
    {
        id: 'sustainability',
        tag: 'Sustainability & Regenerative Agriculture',
        title: 'Drive sustainable farming practices and meet ESG mandates',
        desc: 'Carbon monitoring, biodiversity tracking, and regenerative agriculture frameworks that help you meet regulatory requirements and sustainability commitments.',
        bullets: ['Carbon footprint tracking & reporting', 'Soil health and biodiversity monitoring', 'EUDR deforestation compliance', 'Regenerative agriculture programs', 'ESG reporting dashboards'],
        img: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/6943e1acc_generated_f6a944ba.png',
        reverse: true,
    },
];

export default function Solutions() {
    return (
        <div className="pt-[108px]">
            {/* Hero */}
            <section className="relative py-20 overflow-hidden bg-[#0D1B2A]">
                <div className="absolute inset-0 opacity-20">
                    <img src="https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/e5c95108a_generated_1115053f.png" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <span className="inline-block px-4 py-1.5 bg-[#1A9E6E]/20 text-[#2DD4BF] text-sm font-semibold rounded-full mb-5">Solutions</span>
                        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-5">
                            All-in-one solution for farming, sourcing, and supply chain resilience
                        </h1>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
                            Whether you're grappling with climate challenges, ensuring surety of supply, or advancing regenerative agriculture — BhoomiAI is your trusted partner.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Solutions alternating */}
            <div className="bg-white">
                {solutions.map((sol, i) => (
                    <section key={sol.id} id={sol.id} className={`py-20 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}`}>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className={`grid lg:grid-cols-2 gap-14 items-center ${sol.reverse ? 'lg:flex-row-reverse' : ''}`}>
                                <AnimatedSection className={sol.reverse ? 'lg:order-2' : ''}>
                                    <span className="inline-block px-3 py-1 bg-[#F0FAF7] text-[#1A9E6E] text-xs font-semibold rounded-full mb-4 uppercase tracking-wide">
                                        {sol.tag}
                                    </span>
                                    <h2 className="text-2xl md:text-3xl font-bold text-[#0D1B2A] leading-tight mb-4">{sol.title}</h2>
                                    <p className="text-gray-500 leading-relaxed mb-6">{sol.desc}</p>
                                    <ul className="space-y-2.5 mb-7">
                                        {sol.bullets.map((b, j) => (
                                            <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-[#1A9E6E] flex-shrink-0 mt-0.5" />
                                                {b}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link to="/contact" className="inline-flex items-center gap-1.5 text-[#1A9E6E] font-semibold text-sm hover:underline">
                                        Get started <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </AnimatedSection>
                                <AnimatedSection delay={0.15} className={sol.reverse ? 'lg:order-1' : ''}>
                                    <img src={sol.img} alt={sol.title} className="w-full rounded-2xl shadow-xl object-cover" style={{ maxHeight: 360 }} />
                                </AnimatedSection>
                            </div>
                        </div>
                    </section>
                ))}
            </div>

            {/* CTA */}
            <section className="py-16 bg-[#1A9E6E]">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to build a resilient agri-food operation?</h2>
                    <Link to="/contact" className="inline-block px-8 py-3 bg-white text-[#1A9E6E] font-semibold rounded-full hover:bg-gray-50 transition-colors shadow-lg mt-2">
                        Talk to an Expert
                    </Link>
                </div>
            </section>
        </div>
    );
}
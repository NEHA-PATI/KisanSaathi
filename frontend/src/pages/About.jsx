import { motion } from 'framer-motion';
import AnimatedSection from '../components/shared/AnimatedSection';
import CountUpNumber from '../components/shared/CountUpNumber';
import { Link } from 'react-router-dom';

const milestones = [
    { year: '2010', event: 'Founded with a vision to digitize agriculture globally' },
    { year: '2014', event: 'Launched first farm management platform, digitizing 1M+ acres' },
    { year: '2017', event: 'Expanded to 20+ countries, 5M+ acres under management' },
    { year: '2019', event: 'Launched AI-powered crop intelligence with satellite analytics' },
    { year: '2021', event: 'Reached 15M+ acres, partnered with World Bank and USAID' },
    { year: '2023', event: 'Launched MaatiTrace Cloud & Sage â€” AI-first agri platform' },
    { year: '2025', event: 'Computing 10% of world\'s croppable land, 96+ countries' },
];

const values = [
    { title: 'Mission', desc: 'Maximizing per-acre value for every stakeholder across the food and agriculture value chain â€” from farmers to consumers.' },
    { title: 'Vision', desc: 'To be the intelligence layer of the global food system â€” decoding the biological balance sheet of food and agriculture.' },
    { title: 'Impact', desc: 'Empowering 7M+ farmers, improving livelihoods, and building a more sustainable and resilient global food system.' },
];

export default function About() {
    return (
        <div className="pt-[108px]">
            {/* Hero */}
            <section className="relative py-24 overflow-hidden">
                <div className="absolute inset-0">
                    <img src="https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/a68d892b3_generated_010314da.png" alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-[#0D1B2A]/75" />
                </div>
                <div className="relative max-w-4xl mx-auto px-4">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <span className="inline-block px-4 py-1.5 bg-[#1A9E6E]/20 text-[#2DD4BF] text-sm font-semibold rounded-full mb-5">About MaatiTrace</span>
                        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-5 max-w-3xl">
                            We're building the intelligence layer for global agriculture
                        </h1>
                        <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
                            MaatiTrace is the world's most advanced AI-first agri-food platform, having computed over 1 billion acres of the planet's cultivable land across 96+ countries.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-[#0D1B2A] py-14">
                <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { val: 26, suf: 'M+', label: 'Acres Digitized' },
                        { val: 96, suf: '+', label: 'Countries' },
                        { val: 350, suf: '+', label: 'Crops' },
                        { val: 7, suf: 'M+', label: 'Farmers Empowered' },
                    ].map((s, i) => (
                        <AnimatedSection key={i} delay={i * 0.1}>
                            <div className="text-3xl font-bold text-[#2DD4BF] mb-1">
                                <CountUpNumber end={s.val} suffix={s.suf} />
                            </div>
                            <p className="text-gray-400 text-sm">{s.label}</p>
                        </AnimatedSection>
                    ))}
                </div>
            </section>

            {/* Mission / Vision */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#0D1B2A]">Who We Are</h2>
                    </AnimatedSection>
                    <div className="grid md:grid-cols-3 gap-6">
                        {values.map((v, i) => (
                            <AnimatedSection key={i} delay={i * 0.1}>
                                <div className="p-7 bg-[#F9FAFB] rounded-2xl border border-gray-100 h-full">
                                    <h3 className="font-bold text-[#1A9E6E] text-lg mb-3">{v.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* About section with image */}
            <section className="py-20 bg-[#F9FAFB]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-14 items-center">
                        <AnimatedSection>
                            <h2 className="text-2xl md:text-3xl font-bold text-[#0D1B2A] mb-5 leading-tight">
                                More than a decade of agriculture intelligence
                            </h2>
                            <p className="text-gray-500 leading-relaxed mb-4">
                                Founded in 2010, MaatiTrace started with a simple but ambitious mission: to use data and technology to transform agriculture. Today, we are the world's most advanced AI-first agri-food platform.
                            </p>
                            <p className="text-gray-500 leading-relaxed mb-6">
                                We believe that agriculture â€” the world's largest and most critical industry â€” deserves the same intelligence infrastructure that powers financial markets and tech ecosystems. Our platform combines satellite remote sensing, weather intelligence, and deep learning to decode the biological balance sheet of global food and agriculture.
                            </p>
                            <Link to="/contact" className="inline-flex items-center gap-1.5 text-[#1A9E6E] font-semibold text-sm hover:underline">
                                Get in touch â†’
                            </Link>
                        </AnimatedSection>
                        <AnimatedSection delay={0.15}>
                            <img
                                src="https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/7affef9a0_generated_0dc0da7b.png"
                                alt="MaatiTrace team"
                                className="rounded-2xl shadow-xl w-full object-cover"
                                style={{ maxHeight: 380 }}
                            />
                        </AnimatedSection>
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#0D1B2A]">Our Journey</h2>
                    </AnimatedSection>
                    <div className="relative">
                        <div className="absolute left-6 top-0 bottom-0 w-px bg-[#1A9E6E]/20" />
                        <div className="space-y-8">
                            {milestones.map((m, i) => (
                                <AnimatedSection key={i} delay={i * 0.07}>
                                    <div className="flex items-start gap-6 pl-2">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F0FAF7] border-2 border-[#1A9E6E] flex items-center justify-center z-10 relative">
                                            <span className="text-[10px] font-bold text-[#1A9E6E] leading-none">{m.year}</span>
                                        </div>
                                        <div className="pt-2.5">
                                            <p className="text-gray-700 font-medium">{m.event}</p>
                                        </div>
                                    </div>
                                </AnimatedSection>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Partners */}
            <section className="py-14 bg-[#F9FAFB] border-t border-gray-100">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-8">Our ecosystem partners</p>
                    <div className="flex flex-wrap justify-center gap-8">
                        {['Google', 'BCG', 'Wipro', 'Planet Labs', 'The Weather Company', 'World Bank', 'USAID', 'IFC'].map(p => (
                            <span key={p} className="text-gray-300 font-bold text-base hover:text-[#1A9E6E] transition-colors">{p}</span>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
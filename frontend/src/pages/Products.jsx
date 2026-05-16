import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import AnimatedSection from '../components/shared/AnimatedSection';

const products = [
    {
        id: 'apps',
        logo: 'MaatiTrace Apps',
        tagColor: '#1A9E6E',
        headline: 'Scale your farmer enablement, engagement, and digitize your global field and farm management operations',
        image: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/fd6ab3603_generated_dd446721.png',
        bg: '#EAF6F1',
        tabs: [
            {
                label: 'Supply Chain',
                title: 'Supply Chain Visibility Gaps Cost Millions',
                desc: 'Farms and agribusinesses lose millions due to poor efficiency and market risk caused by gaps in supply chain visibility. Poor farm-to-fork traceability increases compliance risk.',
                bullets: ['Farm-to-fork traceability failures', 'Compliance risks (EUDR, sustainability mandates)', 'Quality inconsistencies across regions'],
                img: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/e0cf675ff_generated_206998ce.png',
            },
            {
                label: 'Farm Data',
                title: 'Farm Data Silos Limit Strategic Decision-Making',
                desc: 'Farm data scattered across paper, spreadsheets, and legacy systems leads to data loss and delayed field data visibility, preventing real-time operational insights.',
                bullets: ['Scattered data across paper & spreadsheets', 'No real-time visibility into field operations', 'Inability to predict yields or optimize resources'],
                img: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/fd6ab3603_generated_dd446721.png',
            },
            {
                label: 'Climate Volatility',
                title: 'Climate Volatility Threatens Supply Continuity',
                desc: 'Climate volatility and weather unpredictability disrupt production and supply chain continuity. Late detection of crop diseases and inefficient input usage worsen losses.',
                bullets: ['Weather unpredictability', 'Late detection of crop disease', 'Inefficient input usage', 'Sustainability pressure'],
                img: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/87c5f161e_generated_02f94e3f.png',
            },
            {
                label: 'Sustainable Sourcing',
                title: 'Make every sourcing decision count for people and planet',
                desc: 'Track sustainability KPIs like soil health, water use, and carbon footprint to meet ESG goals and ensure responsible sourcing across every region.',
                bullets: ['Monitor ESG and sustainability metrics', 'Ensure eco-friendly sourcing practices', 'Align with global sustainability goals'],
                img: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/6943e1acc_generated_f6a944ba.png',
            },
        ],
        subProducts: [
            { name: 'MaatiTrace Grow', desc: 'A farm monitoring and management solution to help you geotag your farms, digitize farm/farmer records, share advisory, monitor crop productivity, and boost field officer productivity.' },
            { name: 'MaatiTrace Connect', desc: 'Easy-to-use, seamless communication solution connecting growers, agri-businesses, and field officers, helping digitize grower activities.' },
            { name: 'MaatiTrace Trace', desc: 'Farm-to-fork traceability solution to track and meet quality benchmarks. Eliminate counterfeiting and ensure everyone in the supply chain is recognized and rewarded.' },
        ],
    },
    {
        id: 'cloud',
        logo: 'MaatiTrace Cloud',
        tagColor: '#1A9E6E',
        headline: 'The future of farming unleashed â€” a multi-tenant, secure, scalable, flexible, and intelligent agriculture cloud platform',
        image: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/81639b858_generated_89e36f7b.png',
        bg: '#EAF6F1',
        subProducts: [
            { name: 'Multi-tenant Architecture', desc: 'Securely manage multiple clients and geographies on a single platform with complete data isolation and enterprise-grade access controls.' },
            { name: 'Scalable Infrastructure', desc: 'Built to scale from hundreds to millions of farms. Process petabytes of agricultural data in real-time with auto-scaling cloud infrastructure.' },
            { name: 'API-First Integration', desc: 'Integrate seamlessly with existing ERP, CRM, and third-party systems through a comprehensive REST API and webhook ecosystem.' },
        ],
    },
    {
        id: 'intelligence',
        logo: 'MaatiTrace Intelligence',
        tagColor: '#1A9E6E',
        headline: 'AI-powered crop and climate intelligence to decode the past, analyze the present, and predict the future of food',
        image: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/a5fc6b422_generated_897d50ab.png',
        bg: '#EAF6F1',
        subProducts: [
            { name: 'Plot-level Intelligence', desc: 'Satellite-powered plot-level crop health monitoring with NDVI analysis, disease early warning, and yield estimation at field granularity.' },
            { name: 'Regional Intelligence', desc: 'Regional crop mapping and production forecasting across geographies to enable strategic sourcing and supply chain planning.' },
            { name: 'Climate Intelligence', desc: 'Advanced climate risk modeling combining weather data, seasonal forecasts, and historical patterns for climate-resilient farming decisions.' },
        ],
    },
    {
        id: 'sage',
        logo: 'MaatiTrace Sage',
        tagColor: '#1A9E6E',
        headline: 'Conversational AI for agriculture â€” answers complex agri queries using vast crop knowledge databases and real-time data',
        image: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/a68d892b3_generated_010314da.png',
        bg: '#EAF6F1',
        subProducts: [
            { name: 'Crop Advisory AI', desc: 'Get instant, context-aware advisory on crop management, pest control, irrigation, and fertilization in natural language.' },
            { name: 'Multi-language Support', desc: 'Accessible in 20+ regional languages to empower farmers and field officers across diverse geographies.' },
            { name: 'Knowledge Graph', desc: 'Powered by MaatiTrace\'s proprietary crop knowledge graph with data from 338+ crops and 8,750+ varieties.' },
        ],
    },
];

export default function Products() {
    const [activeTab, setActiveTab] = useState(0);
    const firstProduct = products[0];

    return (
        <div className="pt-[108px]">
            {/* First product - Apps - with tab panel like Cropin */}
            <section className="bg-[#EAF6F1] pt-16 pb-0 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="text-center mb-2">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 rounded bg-[#1A9E6E]/20 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-sm bg-[#1A9E6E]" />
                            </div>
                            <span className="text-xl font-bold text-[#1A9E6E]">{firstProduct.logo}</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-bold text-[#0D1B2A] max-w-3xl mx-auto leading-tight">
                            {firstProduct.headline}
                        </h1>
                    </AnimatedSection>
                </div>

                {/* App screenshots mockup area */}
                <div className="max-w-5xl mx-auto px-4 mt-10 relative">
                    <img
                        src={firstProduct.image}
                        alt="MaatiTrace Apps"
                        className="w-full object-contain rounded-t-2xl shadow-xl"
                        style={{ maxHeight: 380 }}
                    />
                </div>
            </section>

            {/* Stats row */}
            <section className="bg-[#0D1B2A] py-10">
                <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
                    {[
                        { val: 'Computed over 1 billion acres' },
                        { val: '25% Increase in crop yields' },
                        { val: '80% Drop in pest & disease incidence' },
                    ].map((s, i) => (
                        <div key={i}>
                            <p className="text-[#2DD4BF] font-semibold text-sm md:text-base">{s.val}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Tab panel - Critical Challenges */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#0D1B2A]">
                            The Critical Challenges Facing Global Agricultural Operations
                        </h2>
                    </AnimatedSection>

                    {/* Tabs */}
                    <div className="flex flex-wrap justify-center gap-2 mb-10">
                        {firstProduct.tabs?.map((tab, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveTab(i)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${activeTab === i
                                        ? 'bg-[#1A9E6E] text-white border-[#1A9E6E]'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A9E6E] hover:text-[#1A9E6E]'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {firstProduct.tabs && (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="grid md:grid-cols-2 gap-10 items-center"
                        >
                            <div>
                                <h3 className="text-xl font-bold text-[#0D1B2A] mb-3">{firstProduct.tabs[activeTab].title}</h3>
                                <p className="text-gray-500 mb-5 leading-relaxed">{firstProduct.tabs[activeTab].desc}</p>
                                <ul className="space-y-2.5">
                                    {firstProduct.tabs[activeTab].bullets.map((b, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                            <CheckCircle2 className="w-4 h-4 text-[#1A9E6E] flex-shrink-0 mt-0.5" />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <img src={firstProduct.tabs[activeTab].img} alt="" className="rounded-xl shadow-lg w-full object-cover" style={{ maxHeight: 300 }} />
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* Sub-products for all products */}
            {products.map((product, pi) => (
                <section key={product.id} id={product.id} className={`py-16 ${pi % 2 === 0 ? 'bg-[#F9FAFB]' : 'bg-white'}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {pi > 0 && (
                            <AnimatedSection className="text-center mb-12">
                                <span className="inline-block px-4 py-1.5 bg-[#F0FAF7] text-[#1A9E6E] text-sm font-semibold rounded-full mb-4">
                                    {product.logo}
                                </span>
                                <h2 className="text-2xl md:text-3xl font-bold text-[#0D1B2A] max-w-3xl mx-auto">
                                    {product.headline}
                                </h2>
                            </AnimatedSection>
                        )}

                        {pi > 0 && (
                            <div className="grid md:grid-cols-2 gap-10 items-center mb-12">
                                <AnimatedSection>
                                    <img src={product.image} alt={product.logo} className="rounded-2xl shadow-xl w-full object-cover" style={{ maxHeight: 340 }} />
                                </AnimatedSection>
                                <AnimatedSection delay={0.15}>
                                    <div className="space-y-6">
                                        {product.subProducts.map((sp, i) => (
                                            <div key={i} className="border-l-2 border-[#1A9E6E] pl-4">
                                                <h3 className="font-semibold text-[#0D1B2A] mb-1">{sp.name}</h3>
                                                <p className="text-gray-500 text-sm leading-relaxed">{sp.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </AnimatedSection>
                            </div>
                        )}

                        {pi === 0 && (
                            <div className="grid md:grid-cols-3 gap-6 mt-4">
                                {product.subProducts.map((sp, i) => (
                                    <AnimatedSection key={i} delay={i * 0.1}>
                                        <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                                            <h3 className="font-bold text-[#0D1B2A] mb-2">{sp.name}</h3>
                                            <p className="text-gray-500 text-sm leading-relaxed mb-4">{sp.desc}</p>
                                            <Link to="/contact" className="inline-flex items-center gap-1 text-[#1A9E6E] text-sm font-semibold hover:underline">
                                                Learn more <ChevronRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </AnimatedSection>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            ))}

            {/* CTA */}
            <section className="py-16 bg-[#1A9E6E]">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to transform your agri-food operations?</h2>
                    <p className="text-white/80 mb-8">Get in touch with our team to see MaatiTrace in action.</p>
                    <Link to="/contact" className="inline-block px-8 py-3 bg-white text-[#1A9E6E] font-semibold rounded-full hover:bg-gray-50 transition-colors shadow-lg">
                        Request a Demo
                    </Link>
                </div>
            </section>
        </div>
    );
}
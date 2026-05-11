import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const slides = [
    {
        bg: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/e5c95108a_generated_1115053f.png',
        label: null,
        title: ["World's largest deployed ", 'AI platform', ' for food and agriculture'],
        titleHighlight: 1,
        desc: "As the world's most advanced AI-first agri-food platform, BhoomiAI helps businesses transform food production at scale with the power of regional, plot-level, and climate intelligence.",
        cta: 'Know more about us',
        ctaPath: '/about',
    },
    {
        bg: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/0d419a491_generated_fc366d3b.png',
        label: null,
        title: ['Farming for the future needs a ', 'whole new kind of power', ''],
        titleHighlight: 1,
        desc: 'BhoomiAI Cloud, the future of farming unleashed. BhoomiAI has combined over a decade of expertise in the global agri-food industry to build BhoomiAI Cloud – a multi-tenant, secure, scalable, flexible, and intelligent agriculture cloud platform.',
        cta: 'Explore BhoomiAI Cloud',
        ctaPath: '/products',
    },
    {
        bg: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/be716bdcc_generated_33cf2246.png',
        label: null,
        title: ['', 'All-in-one solution', ' for farming, sourcing, and supply chain resilience'],
        titleHighlight: 1,
        desc: "Whether you're grappling with climate challenges, ensuring surety of supply, meeting demand for sustainably sourced food, or advancing regenerative agriculture — BhoomiAI is your trusted partner in transforming agri-food operations.",
        cta: 'Explore our solutions',
        ctaPath: '/solutions',
    },
    {
        bg: 'https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/7affef9a0_generated_0dc0da7b.png',
        label: null,
        title: ['Decode the past, analyze the present, and predict the future of food with ', 'BhoomiAI', ''],
        titleHighlight: 1,
        desc: "The old sourcing and supply playbook wasn't built for a world of climate and geopolitical volatility. With our predictive and actionable insights, unlock the upcoming season's yield potential and make innovation your new routine.",
        cta: 'Learn more',
        ctaPath: '/products',
    },
];

export default function HeroCarousel() {
    const [current, setCurrent] = useState(0);
    const next = useCallback(() => setCurrent(p => (p + 1) % slides.length), []);
    const prev = () => setCurrent(p => (p - 1 + slides.length) % slides.length);

    useEffect(() => {
        const t = setInterval(next, 6000);
        return () => clearInterval(t);
    }, [next]);

    const slide = slides[current];

    return (
        <section className="relative w-full" style={{ height: '100vh', minHeight: 600, maxHeight: 860 }}>
            {/* Background */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9 }}
                    className="absolute inset-0"
                >
                    <img src={slide.bg} alt="" className="w-full h-full object-cover" />
                    {/* Exact Cropin overlay - dark gradient from bottom, slight top dark */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.55) 100%)' }} />
                </motion.div>
            </AnimatePresence>

            {/* Content - centered like Cropin */}
            <div className="relative z-10 h-full flex items-center justify-center px-4">
                <div className="max-w-3xl w-full text-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.7 }}
                        >
                            <h1 className="text-[2.6rem] md:text-[3.2rem] lg:text-[3.6rem] font-bold text-white leading-tight mb-5" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                                {slide.title[0]}
                                <span className="text-[#2DD4BF]">{slide.title[1]}</span>
                                {slide.title[2]}
                            </h1>
                            <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>
                                {slide.desc}
                            </p>
                            <Link
                                to={slide.ctaPath}
                                className="inline-block px-7 py-3 rounded-full text-sm font-semibold text-white transition-all"
                                style={{ background: 'rgba(26,158,110,0.85)', backdropFilter: 'blur(4px)', border: '1px solid rgba(45,212,191,0.4)' }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(26,158,110,1)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(26,158,110,0.85)'}
                            >
                                {slide.cta}
                            </Link>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Left arrow */}
            <button
                onClick={prev}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full border border-white/40 text-white hover:bg-white/10 transition-all"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            {/* Right arrow */}
            <button
                onClick={next}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full border border-white/40 text-white hover:bg-white/10 transition-all"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dots - exact Cropin pill style */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className="transition-all duration-500 rounded-full"
                        style={{
                            width: i === current ? 32 : 10,
                            height: 10,
                            background: i === current ? '#1A9E6E' : 'rgba(255,255,255,0.5)',
                        }}
                    />
                ))}
            </div>
        </section>
    );
}
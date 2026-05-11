import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function EcosystemBanner() {
    return (
        <section className="py-14 bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl mx-auto text-center"
                >
                    <h2 className="text-2xl md:text-3xl font-bold text-[#0D1B2A] mb-4 leading-snug">
                        BhoomiAI Debuts 'AI-First Digital Transformation Ecosystem' to Unify Fragmented Food Systems
                    </h2>
                    <p className="text-gray-500 text-base mb-6 leading-relaxed">
                        More Than a Decade in the Making, BhoomiAI's Flagship Initiative Unites Google, BCG, Wipro, The Weather Company, and Planet Labs to Power the 21st-Century, Resilient, and Sustainable Food System.
                    </p>
                    <Link
                        to="/about"
                        className="inline-flex items-center gap-2 text-[#1A9E6E] font-semibold text-sm hover:underline transition-colors"
                    >
                        Read more →
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
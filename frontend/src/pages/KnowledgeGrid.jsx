import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Search, ChevronDown } from 'lucide-react';
import AnimatedSection from '../components/shared/AnimatedSection';
import { Link } from 'react-router-dom';

const cropData = [
    {
        category: 'Cereals & Grains',
        crops: [
            { name: 'Rice', varieties: 312, regions: ['Asia', 'Americas', 'Africa'] },
            { name: 'Wheat', varieties: 287, regions: ['Europe', 'Asia', 'Americas'] },
            { name: 'Maize', varieties: 198, regions: ['Americas', 'Africa', 'Asia'] },
            { name: 'Barley', varieties: 124, regions: ['Europe', 'Asia'] },
            { name: 'Sorghum', varieties: 89, regions: ['Africa', 'Asia', 'Americas'] },
            { name: 'Millet', varieties: 76, regions: ['Africa', 'Asia'] },
        ]
    },
    {
        category: 'Plantation Crops',
        crops: [
            { name: 'Coffee', varieties: 95, regions: ['Americas', 'Africa', 'Asia'] },
            { name: 'Tea', varieties: 78, regions: ['Asia', 'Africa'] },
            { name: 'Cocoa', varieties: 56, regions: ['Americas', 'Africa'] },
            { name: 'Rubber', varieties: 34, regions: ['Asia', 'Africa', 'Americas'] },
            { name: 'Oil Palm', varieties: 48, regions: ['Asia', 'Africa', 'Americas'] },
            { name: 'Coconut', varieties: 62, regions: ['Asia', 'Africa', 'Americas'] },
        ]
    },
    {
        category: 'Fruits & Vegetables',
        crops: [
            { name: 'Tomato', varieties: 234, regions: ['Europe', 'Asia', 'Americas'] },
            { name: 'Potato', varieties: 187, regions: ['Americas', 'Europe', 'Asia'] },
            { name: 'Mango', varieties: 156, regions: ['Asia', 'Africa', 'Americas'] },
            { name: 'Banana', varieties: 112, regions: ['Asia', 'Africa', 'Americas'] },
            { name: 'Grapes', varieties: 198, regions: ['Europe', 'Americas', 'Asia'] },
            { name: 'Citrus', varieties: 143, regions: ['Americas', 'Europe', 'Asia'] },
        ]
    },
    {
        category: 'Oilseeds & Pulses',
        crops: [
            { name: 'Soybean', varieties: 167, regions: ['Americas', 'Asia'] },
            { name: 'Groundnut', varieties: 123, regions: ['Asia', 'Africa', 'Americas'] },
            { name: 'Mustard', varieties: 89, regions: ['Asia', 'Europe'] },
            { name: 'Chickpea', varieties: 76, regions: ['Asia', 'Africa', 'Americas'] },
            { name: 'Lentil', varieties: 65, regions: ['Asia', 'Americas', 'Europe'] },
            { name: 'Sunflower', varieties: 98, regions: ['Europe', 'Americas', 'Asia'] },
        ]
    },
];

export default function KnowledgeGrid() {
    const [search, setSearch] = useState('');
    const [openCategory, setOpenCategory] = useState('Cereals & Grains');

    const filtered = search
        ? cropData.map(cat => ({
            ...cat,
            crops: cat.crops.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        })).filter(cat => cat.crops.length > 0)
        : cropData;

    return (
        <div className="pt-[108px]">
            {/* Hero - matches Cropin's Crop Knowledge Grid page */}
            <section className="bg-[#0D1B2A] py-20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <img src="https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/a5fc6b422_generated_897d50ab.png" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <span className="inline-block px-4 py-1.5 bg-[#1A9E6E]/20 text-[#2DD4BF] text-sm font-semibold rounded-full mb-5">
                            Crop Knowledge Grid
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-5">
                            The world's most comprehensive crop intelligence database
                        </h1>
                        <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
                            Access detailed intelligence across 350+ crops and 8,750+ varieties with BhoomiAI's proprietary knowledge grid.
                        </p>
                        {/* Search bar - exact Cropin style */}
                        <div className="max-w-lg mx-auto relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search crops or varieties..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white rounded-full text-sm text-gray-800 shadow-lg outline-none focus:ring-2 focus:ring-[#1A9E6E]"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-[#1A9E6E] py-8">
                <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    {[
                        { val: '350+', label: 'Crops' },
                        { val: '8,750+', label: 'Crop Varieties' },
                        { val: '78%+', label: 'Prediction Accuracy' },
                        { val: '96', label: 'Countries' },
                    ].map((s, i) => (
                        <div key={i}>
                            <div className="text-2xl font-bold text-white">{s.val}</div>
                            <div className="text-white/70 text-sm mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Crop accordion */}
            <section className="py-16 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="mb-10 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#0D1B2A]">Explore by Crop Category</h2>
                    </AnimatedSection>

                    <div className="space-y-3">
                        {filtered.map((cat) => (
                            <div key={cat.category} className="border border-gray-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setOpenCategory(openCategory === cat.category ? null : cat.category)}
                                    className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-[#F9FAFB] transition-colors text-left"
                                >
                                    <span className="font-semibold text-[#0D1B2A]">{cat.category}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-400">{cat.crops.length} crops</span>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openCategory === cat.category ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {openCategory === cat.category && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 pb-5 border-t border-gray-100">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4">
                                                    {cat.crops.map((crop) => (
                                                        <div key={crop.name} className="p-3 bg-[#F9FAFB] rounded-lg hover:bg-[#F0FAF7] hover:border-[#1A9E6E] border border-transparent transition-all cursor-pointer">
                                                            <p className="font-semibold text-[#0D1B2A] text-sm">{crop.name}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5">{crop.varieties} varieties</p>
                                                            <div className="flex gap-1 mt-1.5 flex-wrap">
                                                                {crop.regions.slice(0, 2).map(r => (
                                                                    <span key={r} className="text-[10px] px-1.5 py-0.5 bg-[#1A9E6E]/10 text-[#1A9E6E] rounded-full">{r}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-14 bg-[#F0FAF7] border-t border-[#1A9E6E]/10">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-[#0D1B2A] mb-3">Access the full Crop Knowledge Grid</h2>
                    <p className="text-gray-500 mb-6">Get access to the most comprehensive crop intelligence database for your operations.</p>
                    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-3 bg-[#0D1B2A] text-white font-semibold rounded-full hover:bg-[#14263a] transition-colors shadow-lg">
                        <Map className="h-4 w-4" />
                        View My Land
                    </Link>
                    <Link to="/contact" className="inline-block px-8 py-3 bg-[#1A9E6E] text-white font-semibold rounded-full hover:bg-[#158a5e] transition-colors shadow-lg">
                        Request Access
                    </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

import { Link } from 'react-router-dom';
import {
    Truck, TrendingUp, Leaf, ShieldCheck,
    CloudRain, Lock, Anchor, Globe2,
    Package, BarChart2, AlertTriangle
} from 'lucide-react';

const columns = [
    {
        category: 'Maximize revenue',
        items: [
            { icon: Truck, label: 'Supply chain efficiency', path: '/solutions#supply-chain' },
            { icon: TrendingUp, label: 'Yield & quality improvement', path: '/solutions#yield' },
        ],
    },
    {
        category: 'Maximize Sustainability',
        items: [
            { icon: Leaf, label: 'Ensure regenerative & sustainable practices', path: '/solutions#sustainability' },
            { icon: ShieldCheck, label: 'Ensure traceability, certification & compliance', path: '/solutions#compliance' },
        ],
    },
    {
        category: 'Minimize Risks',
        items: [
            { icon: CloudRain, label: 'Building climate resilience', path: '/solutions#climate' },
            { icon: Lock, label: 'Ensure risk coverage & access to finance', path: '/solutions#finance' },
            { icon: Anchor, label: 'Surety of supply', path: '/solutions#supply' },
            { icon: Globe2, label: 'Market expansion', path: '/solutions#market' },
        ],
    },
    {
        category: 'Minimize Costs',
        items: [
            { icon: Package, label: 'Resilient sourcing', path: '/solutions#sourcing' },
            { icon: BarChart2, label: 'Manage market or price volatility', path: '/solutions#volatility' },
            { icon: AlertTriangle, label: 'Crop loss management', path: '/solutions#crop-loss' },
        ],
    },
];

export default function ValueGrid() {
    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl md:text-3xl font-bold text-[#0D1B2A] text-center mb-12">
                    Helping customers unlock value with digitization and AI
                </h2>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {columns.map((col) => (
                        <div
                            key={col.category}
                            className="bg-[#F9FAFB] rounded-2xl p-5 border border-gray-100"
                        >
                            <h3 className="text-xs font-bold text-[#1A9E6E] mb-4 uppercase tracking-wide">{col.category}</h3>
                            <div className="space-y-3">
                                {col.items.map((item, i) => (
                                    <Link key={i} to={item.path}>
                                        <div className="flex items-start gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
                                            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center group-hover:border-[#1A9E6E] group-hover:bg-[#F0FAF7] transition-colors">
                                                <item.icon className="w-4 h-4 text-gray-500 group-hover:text-[#1A9E6E] transition-colors" />
                                            </div>
                                            <span className="text-sm text-gray-600 group-hover:text-[#1A9E6E] transition-colors leading-snug pt-1.5">
                                                {item.label}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

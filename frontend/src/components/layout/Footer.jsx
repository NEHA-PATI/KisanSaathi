import { Link } from 'react-router-dom';
import { BriefcaseBusiness, Camera, MessageCircle, Play, Users } from 'lucide-react';
import maatiAiLogo from '@/assets/maati-ai-logo.svg';

export default function Footer() {
    return (
        <footer className="bg-[#0D1B2A] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 py-16">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-1.5 mb-5">
                            <img src={maatiAiLogo} alt="MaatiAI" className="h-8 w-8 rounded-full" />
                            <span className="text-lg font-bold text-[#c07a43]">
                                MaatiAI
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            The world's largest deployed AI platform for food and agriculture.
                        </p>
                        <div className="flex gap-3">
                            {[BriefcaseBusiness, MessageCircle, Play, Users, Camera].map((Icon, i) => (
                                <a key={i} href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#1A9E6E] transition-colors">
                                    <Icon className="w-3.5 h-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Products */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Products</h4>
                        <ul className="space-y-2.5">
                            {['MaatiTrace Cloud', 'MaatiTrace Apps', 'MaatiTrace Intelligence', 'MaatiTrace Sage'].map(l => (
                                <li key={l}><Link to="/products" className="text-gray-400 text-sm hover:text-[#2DD4BF] transition-colors">{l}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Solutions */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Solutions</h4>
                        <ul className="space-y-2.5">
                            {['Supply Chain Efficiency', 'Climate Resilience', 'Sustainability', 'Market Expansion'].map(l => (
                                <li key={l}><Link to="/solutions" className="text-gray-400 text-sm hover:text-[#2DD4BF] transition-colors">{l}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Industry */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Industry</h4>
                        <ul className="space-y-2.5">
                            {['Seed Production', 'Food Processing', 'AgriFinance & Insurance', 'Government'].map(l => (
                                <li key={l}><Link to="/industry" className="text-gray-400 text-sm hover:text-[#2DD4BF] transition-colors">{l}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Company</h4>
                        <ul className="space-y-2.5">
                            {[['About Us', '/about'], ['Crop Knowledge Grid', '/knowledge-grid'], ['Contact', '/contact']].map(([l, p]) => (
                                <li key={l}><Link to={p} className="text-gray-400 text-sm hover:text-[#2DD4BF] transition-colors">{l}</Link></li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 py-6 flex flex-col md:flex-row justify-between items-center gap-3">
                    <p className="text-gray-500 text-sm">(c) {new Date().getFullYear()} MaatiTrace. All rights reserved.</p>
                    <div className="flex gap-6">
                        {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
                            <a key={l} href="#" className="text-gray-500 text-xs hover:text-gray-300 transition-colors">{l}</a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

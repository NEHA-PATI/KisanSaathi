import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Search, Menu, X, Globe } from 'lucide-react';

const navItems = [
    {
        label: 'Products',
        submenu: [
            { label: 'MaatiTrace Cloud', path: '/products#cloud' },
            { label: 'MaatiTrace Apps', path: '/products#apps' },
            { label: 'MaatiTrace Intelligence', path: '/products#intelligence' },
            { label: 'MaatiTrace Sage', path: '/products#sage' },
        ]
    },
    {
        label: 'Industry',
        submenu: [
            { label: 'Seed & Trait', path: '/industry#seed' },
            { label: 'Food & Beverage', path: '/industry#food' },
            { label: 'AgriFinance & Insurance', path: '/industry#finance' },
            { label: 'Government & Development', path: '/industry#government' },
        ]
    },
    {
        label: 'Solutions',
        submenu: [
            { label: 'Supply Chain Efficiency', path: '/solutions#supply-chain' },
            { label: 'Yield & Quality Improvement', path: '/solutions#yield' },
            { label: 'Building Climate Resilience', path: '/solutions#climate' },
            { label: 'Sustainability', path: '/solutions#sustainability' },
        ]
    },
    { label: 'Crop Knowledge Grid', path: '/knowledge-grid' },
    { label: 'Traceability', path: '/traceability' },
    {
        label: 'Resources',
        submenu: [
            { label: 'Blog', path: '/resources#blog' },
            { label: 'Case Studies', path: '/resources#case-studies' },
            { label: 'Webinars', path: '/resources#webinars' },
        ]
    },
    {
        label: 'Company',
        submenu: [
            { label: 'About Us', path: '/about' },
            { label: 'Contact', path: '/contact' },
        ]
    },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
        setActiveDropdown(null);
    }, [location]);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex flex-col">
            {/* Main navbar - white bg, exact Cropin layout */}
            <nav className={`bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-[68px]">

                        {/* Logo - MaatiTrace styled like Cropin */}
                        <Link to="/" className="flex items-center gap-1.5 flex-shrink-0">
                            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 4C11.163 4 4 11.163 4 20C4 28.837 11.163 36 20 36C28.837 36 36 28.837 36 20C36 11.163 28.837 4 20 4Z" fill="#1A9E6E" fillOpacity="0.15" />
                                <path d="M20 8C13.373 8 8 13.373 8 20C8 26.627 13.373 32 20 32" stroke="#1A9E6E" strokeWidth="2.5" strokeLinecap="round" />
                                <path d="M20 8C26.627 8 32 13.373 32 20C32 26.627 26.627 32 20 32" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
                                <path d="M14 20C14 20 17 14 24 13C24 13 26 20 20 24C20 24 16 22 14 20Z" fill="#1A9E6E" />
                                <circle cx="26" cy="13" r="2.5" fill="#2DD4BF" />
                            </svg>
                            <span className="text-xl font-bold tracking-tight text-[#1A9E6E]">
                                MaatiTrace
                            </span>
                        </Link>

                        {/* Desktop Nav Items */}
                        <div className="hidden lg:flex items-center gap-0">
                            {navItems.map((item) => (
                                <div
                                    key={item.label}
                                    className="relative"
                                    onMouseEnter={() => item.submenu && setActiveDropdown(item.label)}
                                    onMouseLeave={() => setActiveDropdown(null)}
                                >
                                    {item.path ? (
                                        <Link
                                            to={item.path}
                                            className="flex items-center gap-0.5 px-3.5 py-2 text-[14px] font-medium text-gray-700 hover:text-[#1A9E6E] transition-colors whitespace-nowrap"
                                        >
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <button className="flex items-center gap-0.5 px-3.5 py-2 text-[14px] font-medium text-gray-700 hover:text-[#1A9E6E] transition-colors whitespace-nowrap">
                                            {item.label}
                                            <ChevronDown className="w-3.5 h-3.5 mt-0.5 opacity-60" />
                                        </button>
                                    )}

                                    <AnimatePresence>
                                        {item.submenu && activeDropdown === item.label && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 6 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute top-full left-0 mt-0 w-60 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden"
                                            >
                                                {item.submenu.map((sub) => (
                                                    <Link
                                                        key={sub.label}
                                                        to={sub.path}
                                                        className="block px-5 py-3 text-[13px] text-gray-600 hover:bg-[#F0FAF7] hover:text-[#1A9E6E] transition-colors border-b border-gray-50 last:border-0"
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>

                        {/* Right side */}
                        <div className="hidden lg:flex items-center gap-2">
                            <button className="p-2 text-gray-500 hover:text-[#1A9E6E] transition-colors">
                                <Search className="w-5 h-5" />
                            </button>
                            <button className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-600 hover:text-[#1A9E6E] transition-colors">
                                <Globe className="w-4 h-4" />
                                <span className="text-[13px] font-medium">EN</span>
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            <Link
                                to="/contact"
                                className="ml-1 px-5 py-2 bg-[#1A9E6E] text-white text-[13px] font-semibold rounded-full hover:bg-[#158a5e] transition-colors whitespace-nowrap"
                            >
                                Request Demo
                            </Link>
                        </div>

                        {/* Mobile toggle */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="lg:hidden p-2 text-gray-700"
                        >
                            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {mobileOpen && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="lg:hidden overflow-hidden border-t border-gray-100"
                        >
                            <div className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
                                {navItems.map((item) => (
                                    <div key={item.label}>
                                        {item.path ? (
                                            <Link to={item.path} className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-[#1A9E6E]">
                                                {item.label}
                                            </Link>
                                        ) : (
                                            <div>
                                                <div className="px-3 py-2 text-sm font-semibold text-gray-800">{item.label}</div>
                                                {item.submenu?.map(sub => (
                                                    <Link key={sub.label} to={sub.path} className="block px-6 py-2 text-sm text-gray-600 hover:text-[#1A9E6E]">
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="pt-3">
                                    <Link to="/contact" className="block text-center px-5 py-2.5 bg-[#1A9E6E] text-white text-sm font-semibold rounded-full">
                                        Request Demo
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Mail, Phone, MapPin } from 'lucide-react';
import AnimatedSection from '../components/shared/AnimatedSection';

const offices = [
    { city: 'Bengaluru', country: 'India (HQ)', addr: 'Indiranagar, Bengaluru 560038', phone: '+91 80 4212 1212' },
    { city: 'Amsterdam', country: 'Netherlands', addr: 'Herengracht 420, Amsterdam', phone: '+31 20 123 4567' },
    { city: 'Nairobi', country: 'Kenya', addr: 'Westlands, Nairobi', phone: '+254 20 123 4567' },
];

export default function Contact() {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({ fname: '', lname: '', email: '', company: '', interest: '', message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="pt-[108px]">
            {/* Hero */}
            <section className="bg-[#0D1B2A] py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <span className="inline-block px-4 py-1.5 bg-[#1A9E6E]/20 text-[#2DD4BF] text-sm font-semibold rounded-full mb-5">Contact Us</span>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Let's transform agriculture together</h1>
                        <p className="text-gray-300 text-lg">Ready to unlock the power of AI for your agricultural operations? Get in touch.</p>
                    </motion.div>
                </div>
            </section>

            <section className="py-16 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-5 gap-12">
                        {/* Form */}
                        <AnimatedSection className="lg:col-span-3">
                            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                                <h2 className="text-xl font-bold text-[#0D1B2A] mb-1">Request a Demo</h2>
                                <p className="text-gray-400 text-sm mb-7">Fill out the form and our team will be in touch within 24 hours.</p>

                                {submitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-14"
                                    >
                                        <CheckCircle2 className="w-14 h-14 text-[#1A9E6E] mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-[#0D1B2A] mb-2">Thank you!</h3>
                                        <p className="text-gray-400 text-sm">We've received your request. Our team will contact you within 24 hours.</p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1.5">First Name *</label>
                                                <input required placeholder="John" value={form.fname} onChange={e => setForm({ ...form, fname: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1A9E6E] focus:ring-1 focus:ring-[#1A9E6E] transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Last Name *</label>
                                                <input required placeholder="Doe" value={form.lname} onChange={e => setForm({ ...form, lname: e.target.value })}
                                                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1A9E6E] focus:ring-1 focus:ring-[#1A9E6E] transition-colors" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Work Email *</label>
                                            <input required type="email" placeholder="john@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1A9E6E] focus:ring-1 focus:ring-[#1A9E6E] transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Company *</label>
                                            <input required placeholder="Your company name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1A9E6E] focus:ring-1 focus:ring-[#1A9E6E] transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">I'm interested in</label>
                                            <select value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1A9E6E] focus:ring-1 focus:ring-[#1A9E6E] transition-colors bg-white text-gray-700">
                                                <option value="">Select a topic</option>
                                                <option>MaatiTrace Cloud</option>
                                                <option>MaatiTrace Apps</option>
                                                <option>MaatiTrace Intelligence</option>
                                                <option>MaatiTrace Sage</option>
                                                <option>General Inquiry</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Message</label>
                                            <textarea placeholder="Tell us about your requirements..." rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1A9E6E] focus:ring-1 focus:ring-[#1A9E6E] transition-colors resize-none" />
                                        </div>
                                        <button type="submit" className="w-full py-3 bg-[#1A9E6E] text-white text-sm font-semibold rounded-full hover:bg-[#158a5e] transition-colors shadow-md">
                                            Submit Request
                                        </button>
                                    </form>
                                )}
                            </div>
                        </AnimatedSection>

                        {/* Contact Info */}
                        <AnimatedSection delay={0.15} className="lg:col-span-2">
                            <div className="space-y-7">
                                <div>
                                    <h3 className="text-lg font-bold text-[#0D1B2A] mb-2">Get in Touch</h3>
                                    <div className="space-y-3">
                                        <a href="mailto:hello@maatitrace.com" className="flex items-center gap-3 text-gray-500 hover:text-[#1A9E6E] transition-colors text-sm">
                                            <Mail className="w-4 h-4 text-[#1A9E6E]" /> hello@maatitrace.com
                                        </a>
                                        <a href="tel:+918042121212" className="flex items-center gap-3 text-gray-500 hover:text-[#1A9E6E] transition-colors text-sm">
                                            <Phone className="w-4 h-4 text-[#1A9E6E]" /> +91 80 4212 1212
                                        </a>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-[#0D1B2A] mb-4">Our Offices</h3>
                                    <div className="space-y-4">
                                        {offices.map(o => (
                                            <div key={o.city} className="p-4 bg-[#F9FAFB] rounded-xl border border-gray-100">
                                                <div className="flex items-start gap-3">
                                                    <MapPin className="w-4 h-4 text-[#1A9E6E] flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="font-semibold text-[#0D1B2A] text-sm">{o.city}, {o.country}</p>
                                                        <p className="text-gray-400 text-xs mt-0.5">{o.addr}</p>
                                                        <p className="text-gray-400 text-xs">{o.phone}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </div>
            </section>
        </div>
    );
}

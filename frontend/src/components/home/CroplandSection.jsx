import CountUpNumber from '../shared/CountUpNumber';

const badges = [
    { value: 78, suffix: '%+', label: 'accuracy' },
    { value: 350, suffix: '+', label: 'crops' },
    { value: 8750, suffix: '+', label: 'crop varieties' },
];

export default function CroplandSection() {
    return (
        <section className="py-20 bg-[#F0FAF7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: image */}
                    <div className="relative">
                        <img
                            src="https://media.base44.com/images/public/69f0e05492655c5c8658c4e3/be716bdcc_generated_33cf2246.png"
                            alt="Satellite view of agricultural land"
                            className="rounded-2xl w-full object-cover shadow-xl"
                            style={{ maxHeight: 420 }}
                        />
                        {/* Stat badges overlaid at bottom */}
                        <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center flex-wrap">
                            {badges.map((b, i) => (
                                <div key={i} className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md flex flex-col items-center">
                                    <span className="text-xl font-bold text-[#1A9E6E]">
                                        <CountUpNumber end={b.value} suffix={b.suffix} />
                                    </span>
                                    <span className="text-xs text-gray-500 mt-0.5">{b.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: text */}
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#0D1B2A] leading-tight mb-5">
                            We compute <span className="text-[#1A9E6E]">10%</span> of world's croppable land
                        </h2>
                        <p className="text-gray-500 text-base leading-relaxed">
                            Just as Bloomberg decodes balance sheets and income statements for capital markets, MaatiTrace decodes the biological balance sheet of food-agri, helping predict production, supply risks, sustainability, and future value.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
import CountUpNumber from '../shared/CountUpNumber';

const stats = [
    { value: 26, suffix: 'M', label: 'Acres digitized & 7M farmers empowered' },
    { value: 80, suffix: '%', label: 'Adoption of climate-resilient farming practices' },
    { value: 21, suffix: '%', label: 'Increase in crop yields' },
    { value: 70, suffix: '%', label: 'Drop in pest & disease incidence' },
    { value: 26, suffix: '%', label: 'Rise in farmer incomes' },
];

export default function StatsBar() {
    return (
        <section className="bg-[#0D1B2A] py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-white/80 text-base mb-2">
                    We're not just another agri-tech company
                </p>
                <p className="text-center text-white font-semibold text-base mb-10">
                    We are the agri-Intelligence leader, having computed over 1 billion acres of the planet's cultivable land.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    {stats.map((s, i) => (
                        <div key={i} className="text-center">
                            <div className="text-3xl md:text-4xl font-bold text-[#2DD4BF] mb-2">
                                <CountUpNumber end={s.value} suffix={s.suffix} />
                            </div>
                            <p className="text-gray-400 text-xs md:text-sm leading-snug">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
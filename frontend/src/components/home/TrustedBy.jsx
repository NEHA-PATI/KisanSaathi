
const customers = [
    'World Bank', 'USAID', 'Syngenta', 'Bayer', 'Olam', 'IFC',
    'Nestlé', 'BigBasket', 'EID Parry', 'HDFC Bank', 'Solidaridad', 'Rabobank',
    'Mahindra', 'IFFCO', 'NABARD', 'UN WFP',
];

export default function TrustedBy() {
    return (
        <section className="py-16 bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-gray-400 text-sm font-medium uppercase tracking-widest mb-10">
                    Trusted by global agri-food leaders
                </p>
                <div className="flex flex-wrap justify-center gap-x-10 gap-y-5">
                    {customers.map((name) => (
                        <span
                            key={name}
                            className="text-gray-300 font-bold text-base md:text-lg hover:text-[#1A9E6E] transition-colors cursor-default tracking-wide"
                        >
                            {name}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
import HeroCarousel from '../components/home/HeroCarousel';
import EcosystemBanner from '../components/home/EcosystemBanner';
import StatsBar from '../components/home/StatsBar';
import CroplandSection from '../components/home/CroplandSection';
import ValueGrid from '../components/home/ValueGrid';
import ChallengesSection from '../components/home/ChallengesSection';
import TrustedBy from '../components/home/TrustedBy';

export default function Home() {
    return (
        <div>
            <HeroCarousel />
            <EcosystemBanner />
            <StatsBar />
            <CroplandSection />
            <ValueGrid />
            <ChallengesSection />
            <TrustedBy />
        </div>
    );
}

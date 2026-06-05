import { LandingNav } from './LandingNav';
import { LandingHero } from './LandingHero';
import { LandingPlatforms } from './LandingPlatforms';
import { LandingFeatures } from './LandingFeatures';
import { LandingHowItWorks } from './LandingHowItWorks';
import { LandingCta, LandingFooter } from './LandingCta';

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-slate-950 font-sans text-slate-200 selection:bg-amber-500/30">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingPlatforms />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}

import { LandingNav } from './LandingNav';
import { LandingHero } from './LandingHero';
import { LandingWorkflow } from './LandingWorkflow';
import { LandingFeatures } from './LandingFeatures';
import { LandingSeoSection } from './LandingSeoSection';
import { LandingFaq } from './LandingFaq';
import { LandingCta, LandingFooter } from './LandingCta';
import { LandingJsonLd } from './LandingJsonLd';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface font-sans selection:bg-primary-100 selection:text-primary-900">
      <LandingJsonLd />
      <LandingNav />
      <main>
        <LandingHero />
        <LandingWorkflow />
        <LandingFeatures />
        <LandingSeoSection />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}

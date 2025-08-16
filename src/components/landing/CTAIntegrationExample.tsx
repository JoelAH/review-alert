/**
 * Example integration of CTA components in the landing page
 * This demonstrates how to use the enhanced CTA components with gamification-themed language
 * and prepare for future signup page/modal integration
 */

'use client';

import { Box } from '@mui/material';
import { HeroSection, CTASection, MidPageCTA } from '@/components/landing';
import { LANDING_PAGE_CONTENT } from '@/lib/constants/landingContent';
import { createCTAHandlers, trackCTAClick } from '@/lib/utils/ctaHandlers';
import { useRouter } from 'next/navigation';

const CTAIntegrationExample: React.FC = () => {
  const router = useRouter();
  const ctaHandlers = createCTAHandlers(router);

  // Enhanced handlers with analytics tracking
  const handleHeroPrimary = () => {
    trackCTAClick('primary_signup', 'hero_section');
    ctaHandlers.handlePrimarySignup();
  };

  const handleHeroLearnMore = () => {
    trackCTAClick('learn_more', 'hero_section');
    ctaHandlers.handleLearnMore();
  };

  const handleHeroDemo = () => {
    trackCTAClick('see_demo', 'hero_section');
    ctaHandlers.handleSeeDemo();
  };

  const handleMidPagePrimary = () => {
    trackCTAClick('primary_signup', 'mid_page');
    ctaHandlers.handlePrimarySignup();
  };

  const handleMidPageExplore = () => {
    trackCTAClick('explore_features', 'mid_page');
    ctaHandlers.handleLearnMore();
  };

  const handleMidPageDemo = () => {
    trackCTAClick('watch_demo', 'mid_page');
    ctaHandlers.handleSeeDemo();
  };

  const handleFinalPrimary = () => {
    trackCTAClick('primary_signup', 'final_cta');
    ctaHandlers.handleGetStarted();
  };

  const handleFinalLearnMore = () => {
    trackCTAClick('learn_more', 'final_cta');
    ctaHandlers.handleLearnMore();
  };

  return (
    <Box>
      {/* Hero Section with Primary + Secondary CTAs */}
      <HeroSection
        title={LANDING_PAGE_CONTENT.hero.title}
        subtitle={LANDING_PAGE_CONTENT.hero.subtitle}
        ctaText={LANDING_PAGE_CONTENT.ctaSections.hero.primary}
        onCtaClick={handleHeroPrimary}
        secondaryActions={[
          {
            text: LANDING_PAGE_CONTENT.ctaSections.hero.secondary[0], // "Learn More"
            onClick: handleHeroLearnMore
          },
          {
            text: LANDING_PAGE_CONTENT.ctaSections.hero.secondary[1], // "See Demo"
            onClick: handleHeroDemo
          }
        ]}
      />

      {/* Mid-Page CTA (can be placed between features and gamification sections) */}
      <MidPageCTA
        title={LANDING_PAGE_CONTENT.ctaSections.midPage.title}
        description={LANDING_PAGE_CONTENT.ctaSections.midPage.description}
        primaryText={LANDING_PAGE_CONTENT.ctaSections.midPage.primary}
        onPrimaryClick={handleMidPagePrimary}
        secondaryActions={[
          {
            text: LANDING_PAGE_CONTENT.ctaSections.midPage.secondary[0], // "Explore Features"
            onClick: handleMidPageExplore
          },
          {
            text: LANDING_PAGE_CONTENT.ctaSections.midPage.secondary[1], // "Watch Demo"
            onClick: handleMidPageDemo
          }
        ]}
      />

      {/* Final CTA Section (conversion-focused) */}
      <CTASection
        title={LANDING_PAGE_CONTENT.ctaSections.final.title}
        description={LANDING_PAGE_CONTENT.ctaSections.final.description}
        ctaText={LANDING_PAGE_CONTENT.ctaSections.final.primary}
        onCtaClick={handleFinalPrimary}
        variant="primary"
        secondaryActions={[
          {
            text: LANDING_PAGE_CONTENT.ctaSections.final.secondary[0], // "Learn More"
            onClick: handleFinalLearnMore
          }
        ]}
      />

      {/* Alternative: Simple final CTA without secondary actions */}
      <CTASection
        title={LANDING_PAGE_CONTENT.finalCTA.title}
        description={LANDING_PAGE_CONTENT.finalCTA.description}
        ctaText={LANDING_PAGE_CONTENT.finalCTA.ctaText}
        onCtaClick={handleFinalPrimary}
        variant="primary"
      />
    </Box>
  );
};

export default CTAIntegrationExample;
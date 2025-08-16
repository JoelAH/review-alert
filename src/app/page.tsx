'use client';

import { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import {
  HeroSection,
  FeaturesGrid,
  GamificationShowcase,
  AudienceSection,
  DifferentiationSection,
  PricingSection,
  MidPageCTA,
  CTASection
} from '@/components/landing';
import { LANDING_PAGE_CONTENT } from '@/lib/constants/landingContent';
import { initKeyboardNavigation } from '@/lib/utils/keyboard';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Initialize keyboard navigation on component mount
  useEffect(() => {
    initKeyboardNavigation();
  }, []);

  // CTA handlers - navigate to signup page
  const handlePrimaryCTA = () => {
    router.push('/signup');
  };





  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      margin: 0,
      padding: 0,
      overflowX: 'hidden'
    }}>
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 999,
          padding: '8px 16px',
          background: '#000',
          color: '#fff',
          textDecoration: 'none',
          fontSize: '14px'
        }}
        onFocus={(e) => {
          e.target.style.left = '6px';
          e.target.style.top = '6px';
        }}
        onBlur={(e) => {
          e.target.style.left = '-9999px';
          e.target.style.top = 'auto';
        }}
      >
        Skip to main content
      </a>

      {/* Main Content */}
      <main id="main-content" role="main">
        {/* Hero Section */}
        <section aria-labelledby="hero-heading">
          <HeroSection
            title={LANDING_PAGE_CONTENT.hero.title}
            subtitle={LANDING_PAGE_CONTENT.hero.subtitle}
            ctaText={LANDING_PAGE_CONTENT.hero.ctaText}
            onCtaClick={handlePrimaryCTA}
          />
        </section>

        {/* Features Grid */}
        <section aria-labelledby="features-heading">
          <Box sx={{ py: { xs: 4, sm: 6, md: 8 } }}>
            <FeaturesGrid features={LANDING_PAGE_CONTENT.features} />
          </Box>
        </section>

        {/* Gamification Showcase */}
        <section aria-labelledby="gamification-heading">
          <Box sx={{ bgcolor: 'grey.50', py: { xs: 4, sm: 6, md: 8 } }}>
            <GamificationShowcase
              currentXP={LANDING_PAGE_CONTENT.gamification.sampleXP}
              currentLevel={LANDING_PAGE_CONTENT.gamification.sampleLevel}
              nextLevelXP={2000}
              recentTasks={LANDING_PAGE_CONTENT.gamification.sampleTasks}
            />
          </Box>
        </section>

        {/* Mid-Page CTA */}
        <section aria-labelledby="midpage-cta-heading">
          <Box sx={{ py: { xs: 4, sm: 6, md: 8 } }}>
            <MidPageCTA
              title={LANDING_PAGE_CONTENT.ctaSections.midPage.title}
              description={LANDING_PAGE_CONTENT.ctaSections.midPage.description}
              primaryText={LANDING_PAGE_CONTENT.ctaSections.midPage.primary}
              onPrimaryClick={handlePrimaryCTA}
            />
          </Box>
        </section>

        {/* Target Audience Section */}
        <section aria-labelledby="audience-heading">
          <Box sx={{ bgcolor: 'grey.50', py: { xs: 4, sm: 6, md: 8 } }}>
            <AudienceSection personas={LANDING_PAGE_CONTENT.personas} />
          </Box>
        </section>

        {/* Differentiation Section */}
        <section aria-labelledby="differentiation-heading">
          <Box sx={{ py: { xs: 4, sm: 6, md: 8 } }}>
            <DifferentiationSection
              title={LANDING_PAGE_CONTENT.differentiation.title}
              subtitle={LANDING_PAGE_CONTENT.differentiation.subtitle}
              comparisons={LANDING_PAGE_CONTENT.differentiation.comparisons}
              uniqueValue={LANDING_PAGE_CONTENT.differentiation.uniqueValue}
            />
          </Box>
        </section>

        {/* Pricing Section */}
        <section aria-labelledby="pricing-heading">
          <Box sx={{ bgcolor: 'grey.50', py: { xs: 4, sm: 6, md: 8 } }}>
            <PricingSection onGetStartedClick={handlePrimaryCTA} />
          </Box>
        </section>

        {/* Final CTA Section */}
        <section aria-labelledby="final-cta-heading">
          <Box sx={{ bgcolor: 'primary.main', color: 'white', py: { xs: 6, sm: 8, md: 10 } }}>
            <CTASection
              title={LANDING_PAGE_CONTENT.finalCTA.title}
              description={LANDING_PAGE_CONTENT.finalCTA.description}
              ctaText={LANDING_PAGE_CONTENT.finalCTA.ctaText}
              onCtaClick={handlePrimaryCTA}
              variant="primary"
            />
          </Box>
        </section>
      </main>

      {/* Footer - Updated branding */}
      <footer role="contentinfo">
        <Box component="div" sx={{ bgcolor: 'background.paper', py: 6 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 Review Alert. All rights reserved.
          </Typography>
        </Box>
      </footer>
    </div>
  );
};

export default LandingPage;
/**
 * CTA Handler utilities for landing page actions
 * Provides navigation functions for landing page CTAs
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface CTAHandlers {
  handlePrimarySignup: () => void;
  handleLearnMore: () => void;
  handleSeeDemo: () => void;
  handleGetStarted: () => void;
}

// Navigation-based handlers for landing page CTAs
export const createCTAHandlers = (router: AppRouterInstance): CTAHandlers => {
  const handlePrimarySignup = () => {
    router.push('/signup');
  };

  const handleLearnMore = () => {
    // Scroll to features section
    const featuresSection = document.querySelector('[data-section="features"]');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSeeDemo = () => {
    // Scroll to gamification showcase
    const gamificationSection = document.querySelector('[data-section="gamification"]');
    if (gamificationSection) {
      gamificationSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    router.push('/signup');
  };

  return {
    handlePrimarySignup,
    handleLearnMore,
    handleSeeDemo,
    handleGetStarted
  };
};

// Analytics tracking helpers (ready for future integration)
export const trackCTAClick = (ctaType: string, location: string) => {
  // TODO: Replace with actual analytics tracking (Google Analytics, Mixpanel, etc.)
  console.log(`CTA clicked: ${ctaType} at ${location}`);
  
  // Example structure for future analytics integration:
  // analytics.track('CTA Clicked', {
  //   cta_type: ctaType,
  //   location: location,
  //   timestamp: new Date().toISOString()
  // });
};

// Gamification-themed CTA text variants
export const GAMIFICATION_CTA_VARIANTS = {
  primary: [
    'Start Your Journey',
    'Begin Your Quest',
    'Level Up Now',
    'Join the Adventure'
  ],
  secondary: [
    'Learn More',
    'Explore Features',
    'Discover More'
  ],
  demo: [
    'See Demo',
    'Watch Preview',
    'Try It Out'
  ],
  final: [
    'Ready to Level Up?',
    'Start Your Review Journey',
    'Transform Your Reviews'
  ]
};
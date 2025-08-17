// Landing page components
export { default as HeroSection } from './HeroSection';
export { default as FeatureCard } from './FeatureCard';
export { default as FeaturesGrid } from './FeaturesGrid';
export { default as GamificationShowcase } from './GamificationShowcase';
export { default as AudienceSection } from './AudienceSection';
export { default as DifferentiationSection } from './DifferentiationSection';
export { default as PricingSection } from './PricingSection';
export { default as CTASection } from './CTASection';
export { default as MidPageCTA } from './MidPageCTA';

// Re-export types for convenience
export type {
  HeroSectionProps,
  FeatureCardProps,
  FeaturesGridProps,
  GamificationShowcaseProps,
  AudienceSectionProps,
  DifferentiationSectionProps,
  CTAProps,
  LandingPageContent,
  Task,
  PersonaCard,
  ComparisonPoint,
  SecondaryAction,
  CTASectionConfig
} from '@/types/landing';
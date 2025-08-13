// Hero Section Interfaces
export interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  onCtaClick: () => void;
  secondaryActions?: SecondaryAction[];
}

// Feature Card Interfaces
export interface FeatureCardProps {
  icon: any; // Material-UI icon component
  title: string;
  description: string;
  isPrimary?: boolean;
}

export interface FeaturesGridProps {
  features: FeatureCardProps[];
}

// Gamification Interfaces
export interface Task {
  id: string;
  title: string;
  xpReward: number;
  completed: boolean;
}

export interface GamificationShowcaseProps {
  currentXP: number;
  currentLevel: number;
  nextLevelXP: number;
  recentTasks: Task[];
}

// Target Audience Interfaces
export interface PersonaCard {
  title: string;
  description: string;
  painPoints: string[];
  benefits: string[];
}

export interface AudienceSectionProps {
  personas: PersonaCard[];
}

// Call-to-Action Interfaces
export interface SecondaryAction {
  text: string;
  onClick: () => void;
}

export interface CTAProps {
  title: string;
  description?: string;
  ctaText: string;
  onCtaClick: () => void;
  variant?: 'primary' | 'secondary';
  secondaryActions?: SecondaryAction[];
}

// Differentiation Section Interfaces
export interface ComparisonPoint {
  basic: string;
  reviewAlert: string;
  benefit: string;
}

export interface DifferentiationSectionProps {
  title: string;
  subtitle: string;
  comparisons: ComparisonPoint[];
  uniqueValue: {
    title: string;
    description: string;
    highlights: string[];
  };
}

// CTA Section Configuration
export interface CTASectionConfig {
  title: string;
  description: string;
  primary: string;
  secondary: string[];
}

// Main Landing Page Content Model
export interface LandingPageContent {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
  };
  features: FeatureCardProps[];
  gamification: {
    sampleXP: number;
    sampleLevel: number;
    sampleTasks: Task[];
  };
  personas: PersonaCard[];
  differentiation: {
    title: string;
    subtitle: string;
    comparisons: ComparisonPoint[];
    uniqueValue: {
      title: string;
      description: string;
      highlights: string[];
    };
  };
  finalCTA: {
    title: string;
    description: string;
    ctaText: string;
  };
  ctaSections: {
    hero: {
      primary: string;
      secondary: string[];
    };
    midPage: CTASectionConfig;
    final: CTASectionConfig;
  };
}
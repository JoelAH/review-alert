/**
 * Badge Service - Badge evaluation and progress tracking logic
 * Handles badge definitions, requirement evaluation, and progress calculation
 */

import { 
  BadgeDefinition, 
  BadgeCategory, 
  BadgeRequirement, 
  Badge, 
  BadgeProgress,
  GamificationData 
} from '@/types/gamification';

// Badge definitions based on requirements 2.1-2.8
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Earned your first 100 XP',
    category: BadgeCategory.MILESTONE,
    requirements: [{ type: 'xp', value: 100 }]
  },
  {
    id: 'quest-explorer',
    name: 'Quest Explorer',
    description: 'Reached 500 XP',
    category: BadgeCategory.MILESTONE,
    requirements: [{ type: 'xp', value: 500 }]
  },
  {
    id: 'review-master',
    name: 'Review Master',
    description: 'Reached 1000 XP',
    category: BadgeCategory.MILESTONE,
    requirements: [{ type: 'xp', value: 1000 }]
  },
  {
    id: 'platform-expert',
    name: 'Platform Expert',
    description: 'Reached 2500 XP',
    category: BadgeCategory.MILESTONE,
    requirements: [{ type: 'xp', value: 2500 }]
  },
  {
    id: 'quest-warrior',
    name: 'Quest Warrior',
    description: 'Completed 10 quests',
    category: BadgeCategory.ACHIEVEMENT,
    requirements: [{ type: 'activity_count', value: 10, field: 'questsCompleted' }]
  },
  {
    id: 'dedicated-user',
    name: 'Dedicated User',
    description: 'Maintained a 7-day login streak',
    category: BadgeCategory.STREAK,
    requirements: [{ type: 'streak', value: 7 }]
  },
  {
    id: 'app-collector',
    name: 'App Collector',
    description: 'Added 3 or more apps to track',
    category: BadgeCategory.COLLECTION,
    requirements: [{ type: 'activity_count', value: 3, field: 'appsAdded' }]
  },
  {
    id: 'quest-legend',
    name: 'Quest Legend',
    description: 'Completed 50 quests',
    category: BadgeCategory.ACHIEVEMENT,
    requirements: [{ type: 'activity_count', value: 50, field: 'questsCompleted' }]
  }
];

export class BadgeService {
  /**
   * Check and award badges based on user's gamification data
   * @param userId - The user's ID
   * @param gamificationData - User's current gamification data
   * @returns Promise<Badge[]> - Array of newly earned badges
   */
  static async checkAndAwardBadges(
    userId: string, 
    gamificationData: GamificationData
  ): Promise<Badge[]> {
    try {
      const earnedBadgeIds = new Set(gamificationData.badges.map(badge => badge.id));
      const newlyEarnedBadges: Badge[] = [];

      for (const badgeDefinition of this.getBadgeDefinitions()) {
        // Skip if badge is already earned
        if (earnedBadgeIds.has(badgeDefinition.id)) {
          continue;
        }

        // Check if all requirements are met
        const requirementsMet = this.evaluateBadgeRequirements(
          badgeDefinition.requirements,
          gamificationData
        );

        if (requirementsMet) {
          const newBadge: Badge = {
            id: badgeDefinition.id,
            name: badgeDefinition.name,
            description: badgeDefinition.description,
            iconUrl: badgeDefinition.iconUrl,
            earnedAt: new Date(),
            category: badgeDefinition.category
          };

          newlyEarnedBadges.push(newBadge);
        }
      }

      return newlyEarnedBadges;
    } catch (error) {
      console.error('Error checking and awarding badges:', error);
      throw new Error(`Failed to check badges: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all available badge definitions
   * @returns BadgeDefinition[] - Array of all badge definitions
   */
  static getBadgeDefinitions(): BadgeDefinition[] {
    return [...BADGE_DEFINITIONS];
  }

  /**
   * Get user's earned badges
   * @param gamificationData - User's gamification data
   * @returns Badge[] - Array of earned badges
   */
  static getUserBadges(gamificationData: GamificationData): Badge[] {
    return [...gamificationData.badges];
  }

  /**
   * Calculate progress toward unearned badges
   * @param gamificationData - User's current gamification data
   * @returns BadgeProgress[] - Array of badge progress information
   */
  static getBadgeProgress(gamificationData: GamificationData): BadgeProgress[] {
    const earnedBadgeIds = new Set(gamificationData.badges.map(badge => badge.id));
    const badgeProgress: BadgeProgress[] = [];

    for (const badgeDefinition of this.getBadgeDefinitions()) {
      const earned = earnedBadgeIds.has(badgeDefinition.id);
      const { progress, target } = this.calculateBadgeProgress(
        badgeDefinition.requirements,
        gamificationData
      );

      badgeProgress.push({
        badge: badgeDefinition,
        progress,
        target,
        earned
      });
    }

    return badgeProgress;
  }

  /**
   * Evaluate if badge requirements are met
   * @param requirements - Array of badge requirements
   * @param gamificationData - User's gamification data
   * @returns boolean - True if all requirements are met
   */
  private static evaluateBadgeRequirements(
    requirements: BadgeRequirement[],
    gamificationData: GamificationData
  ): boolean {
    return requirements.every(requirement => {
      switch (requirement.type) {
        case 'xp':
          return gamificationData.xp >= requirement.value;
        
        case 'activity_count':
          if (!requirement.field) {
            console.warn(`Activity count requirement missing field for badge requirement`);
            return false;
          }
          const activityValue = gamificationData.activityCounts[
            requirement.field as keyof typeof gamificationData.activityCounts
          ];
          return activityValue >= requirement.value;
        
        case 'streak':
          return gamificationData.streaks.longestLoginStreak >= requirement.value;
        
        case 'combination':
          // For future complex requirements combining multiple conditions
          // Currently not implemented as no badges require this
          return false;
        
        default:
          console.warn(`Unknown requirement type: ${requirement.type}`);
          return false;
      }
    });
  }

  /**
   * Calculate progress toward a badge
   * @param requirements - Array of badge requirements
   * @param gamificationData - User's gamification data
   * @returns Object with progress and target values
   */
  private static calculateBadgeProgress(
    requirements: BadgeRequirement[],
    gamificationData: GamificationData
  ): { progress: number; target: number } {
    // For badges with multiple requirements, we'll use the first requirement for progress
    // This can be enhanced later for more complex badge requirements
    const primaryRequirement = requirements[0];
    
    if (!primaryRequirement) {
      return { progress: 0, target: 1 };
    }

    switch (primaryRequirement.type) {
      case 'xp':
        return {
          progress: Math.min(gamificationData.xp, primaryRequirement.value),
          target: primaryRequirement.value
        };
      
      case 'activity_count':
        if (!primaryRequirement.field) {
          return { progress: 0, target: primaryRequirement.value };
        }
        const activityValue = gamificationData.activityCounts[
          primaryRequirement.field as keyof typeof gamificationData.activityCounts
        ];
        return {
          progress: Math.min(activityValue, primaryRequirement.value),
          target: primaryRequirement.value
        };
      
      case 'streak':
        return {
          progress: Math.min(gamificationData.streaks.longestLoginStreak, primaryRequirement.value),
          target: primaryRequirement.value
        };
      
      case 'combination':
        // For future complex requirements
        return { progress: 0, target: 1 };
      
      default:
        return { progress: 0, target: 1 };
    }
  }

  /**
   * Get badge definition by ID
   * @param badgeId - The badge ID to find
   * @returns BadgeDefinition | undefined - Badge definition if found
   */
  static getBadgeDefinitionById(badgeId: string): BadgeDefinition | undefined {
    return BADGE_DEFINITIONS.find(badge => badge.id === badgeId);
  }

  /**
   * Get badges by category
   * @param category - Badge category to filter by
   * @returns BadgeDefinition[] - Array of badge definitions in the category
   */
  static getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
    return BADGE_DEFINITIONS.filter(badge => badge.category === category);
  }
}
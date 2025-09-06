/**
 * Gamification Data Migration Service
 * Handles migration of existing gamification data to new persistence format
 */

import UserModel from '@/lib/models/server/user';
import { GamificationPersistenceService } from './gamificationPersistence';
import { GamificationData } from '@/types/gamification';

export interface MigrationResult {
  totalUsers: number;
  migratedUsers: number;
  failedUsers: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
}

export interface MigrationOptions {
  batchSize?: number;
  dryRun?: boolean;
  validateOnly?: boolean;
  backupBeforeMigration?: boolean;
}

export class GamificationMigrationService {
  private static readonly DEFAULT_BATCH_SIZE = 100;

  /**
   * Migrate all users' gamification data to new format with validation
   * @param options - Migration options
   * @returns Promise<MigrationResult> - Migration results
   */
  static async migrateAllUsers(options: MigrationOptions = {}): Promise<MigrationResult> {
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      dryRun = false,
      validateOnly = false,
      backupBeforeMigration = true
    } = options;

    const result: MigrationResult = {
      totalUsers: 0,
      migratedUsers: 0,
      failedUsers: 0,
      errors: []
    };

    try {
      // Get total count of users with gamification data
      const totalUsers = await UserModel.countDocuments({
        gamification: { $exists: true, $ne: null }
      });

      result.totalUsers = totalUsers;

      if (totalUsers === 0) {
        console.log('No users with gamification data found');
        return result;
      }

      console.log(`Starting migration for ${totalUsers} users (batch size: ${batchSize})`);

      // Process users in batches
      let skip = 0;
      while (skip < totalUsers) {
        const users = await UserModel.find({
          gamification: { $exists: true, $ne: null }
        })
        .select('_id gamification')
        .skip(skip)
        .limit(batchSize)
        .lean();

        for (const user of users) {
          try {
            await this.migrateUser(user._id.toString(), user.gamification, {
              dryRun,
              validateOnly,
              backupBeforeMigration
            });
            result.migratedUsers++;
          } catch (error) {
            result.failedUsers++;
            result.errors.push({
              userId: user._id.toString(),
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            console.error(`Failed to migrate user ${user._id}:`, error);
          }
        }

        skip += batchSize;
        console.log(`Processed ${Math.min(skip, totalUsers)}/${totalUsers} users`);
      }

      console.log(`Migration completed: ${result.migratedUsers} successful, ${result.failedUsers} failed`);
      return result;

    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Migrate a single user's gamification data
   * @param userId - The user's ID
   * @param currentData - Current gamification data
   * @param options - Migration options
   */
  private static async migrateUser(
    userId: string,
    currentData: any,
    options: {
      dryRun: boolean;
      validateOnly: boolean;
      backupBeforeMigration: boolean;
    }
  ): Promise<void> {
    const { dryRun, validateOnly, backupBeforeMigration } = options;

    // Create backup if requested
    if (backupBeforeMigration && !dryRun && !validateOnly) {
      try {
        await GamificationPersistenceService.createBackup(userId);
      } catch (error) {
        console.warn(`Failed to create backup for user ${userId}:`, error);
      }
    }

    // Normalize and validate the data
    const normalizedData = this.normalizeGamificationData(currentData);
    
    // Validate the normalized data
    try {
      GamificationPersistenceService.validateGamificationData(normalizedData);
    } catch (validationError) {
      if (validateOnly) {
        throw new Error(`Validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`);
      }
      
      // Try to fix common issues
      const fixedData = this.fixCommonDataIssues(normalizedData);
      GamificationPersistenceService.validateGamificationData(fixedData);
      
      console.warn(`Fixed data issues for user ${userId}`);
    }

    // If this is just validation, we're done
    if (validateOnly) {
      return;
    }

    // If this is a dry run, log what would be done
    if (dryRun) {
      console.log(`[DRY RUN] Would migrate user ${userId} with data:`, {
        xp: normalizedData.xp,
        level: normalizedData.level,
        badgeCount: normalizedData.badges.length,
        streaks: normalizedData.streaks,
        activityCounts: normalizedData.activityCounts,
        xpHistoryLength: normalizedData.xpHistory.length
      });
      return;
    }

    // Perform the actual migration
    await UserModel.findByIdAndUpdate(
      userId,
      {
        gamification: normalizedData,
        updatedAt: new Date()
      },
      {
        runValidators: true
      }
    );
  }

  /**
   * Normalize gamification data to current format
   * @param data - Raw gamification data
   * @returns GamificationData - Normalized data
   */
  private static normalizeGamificationData(data: any): GamificationData {
    // Handle missing or invalid data
    if (!data || typeof data !== 'object') {
      return this.createDefaultGamificationData();
    }

    // Normalize XP and level
    const xp = Math.max(0, parseInt(data.xp) || 0);
    const level = Math.max(1, parseInt(data.level) || 1);

    // Normalize badges
    const badges = Array.isArray(data.badges) ? data.badges.map((badge: any) => ({
      id: badge.id || '',
      name: badge.name || '',
      description: badge.description || '',
      iconUrl: badge.iconUrl,
      earnedAt: badge.earnedAt ? new Date(badge.earnedAt) : new Date(),
      category: badge.category || 'MILESTONE'
    })).filter((badge: any) => badge.id) : [];

    // Normalize streaks
    const streaks = {
      currentLoginStreak: Math.max(0, parseInt(data.streaks?.currentLoginStreak) || 0),
      longestLoginStreak: Math.max(0, parseInt(data.streaks?.longestLoginStreak) || 0),
      lastLoginDate: data.streaks?.lastLoginDate ? new Date(data.streaks.lastLoginDate) : undefined
    };

    // Normalize activity counts
    const activityCounts = {
      questsCreated: Math.max(0, parseInt(data.activityCounts?.questsCreated) || 0),
      questsCompleted: Math.max(0, parseInt(data.activityCounts?.questsCompleted) || 0),
      questsInProgress: Math.max(0, parseInt(data.activityCounts?.questsInProgress) || 0),
      appsAdded: Math.max(0, parseInt(data.activityCounts?.appsAdded) || 0),
      reviewInteractions: Math.max(0, parseInt(data.activityCounts?.reviewInteractions) || 0),
    };

    // Normalize XP history
    const xpHistory = Array.isArray(data.xpHistory) ? data.xpHistory.map((transaction: any) => ({
      amount: parseInt(transaction.amount) || 0,
      action: transaction.action || 'QUEST_CREATED',
      timestamp: transaction.timestamp ? new Date(transaction.timestamp) : new Date(),
      metadata: transaction.metadata || {}
    })).sort((a: any, b: any) => a.timestamp.getTime() - b.timestamp.getTime()) : [];

    return {
      xp,
      level,
      badges,
      streaks,
      activityCounts,
      xpHistory
    };
  }

  /**
   * Fix common data issues
   * @param data - Gamification data with issues
   * @returns GamificationData - Fixed data
   */
  private static fixCommonDataIssues(data: GamificationData): GamificationData {
    const fixed = { ...data };

    // Fix negative XP
    if (fixed.xp < 0) {
      console.warn(`Fixing negative XP: ${fixed.xp} -> 0`);
      fixed.xp = 0;
    }

    // Fix level consistency
    const expectedLevel = this.calculateLevel(fixed.xp);
    if (fixed.level !== expectedLevel) {
      console.warn(`Fixing level inconsistency: ${fixed.level} -> ${expectedLevel} (XP: ${fixed.xp})`);
      fixed.level = expectedLevel;
    }

    // Fix negative activity counts
    Object.keys(fixed.activityCounts).forEach(key => {
      const count = fixed.activityCounts[key as keyof typeof fixed.activityCounts];
      if (count < 0) {
        console.warn(`Fixing negative activity count ${key}: ${count} -> 0`);
        (fixed.activityCounts as any)[key] = 0;
      }
    });

    // Fix negative streaks
    if (fixed.streaks.currentLoginStreak < 0) {
      console.warn(`Fixing negative current streak: ${fixed.streaks.currentLoginStreak} -> 0`);
      fixed.streaks.currentLoginStreak = 0;
    }
    if (fixed.streaks.longestLoginStreak < 0) {
      console.warn(`Fixing negative longest streak: ${fixed.streaks.longestLoginStreak} -> 0`);
      fixed.streaks.longestLoginStreak = 0;
    }

    // Remove duplicate badges
    const uniqueBadges = fixed.badges.filter((badge, index, array) => 
      array.findIndex(b => b.id === badge.id) === index
    );
    if (uniqueBadges.length !== fixed.badges.length) {
      console.warn(`Removing ${fixed.badges.length - uniqueBadges.length} duplicate badges`);
      fixed.badges = uniqueBadges;
    }

    // Sort XP history by timestamp
    fixed.xpHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return fixed;
  }

  /**
   * Calculate level from XP (simplified version)
   * @param xp - XP amount
   * @returns number - Level
   */
  private static calculateLevel(xp: number): number {
    const thresholds = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000];
    
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (xp >= thresholds[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Create default gamification data
   * @returns GamificationData - Default data
   */
  private static createDefaultGamificationData(): GamificationData {
    return {
      xp: 0,
      level: 1,
      badges: [],
      streaks: {
        currentLoginStreak: 0,
        longestLoginStreak: 0,
      },
      activityCounts: {
        questsCreated: 0,
        questsCompleted: 0,
        questsInProgress: 0,
        appsAdded: 0,
        reviewInteractions: 0,
      },
      xpHistory: [],
    };
  }

  /**
   * Validate all users' gamification data
   * @param options - Validation options
   * @returns Promise<MigrationResult> - Validation results
   */
  static async validateAllUsers(options: { batchSize?: number } = {}): Promise<MigrationResult> {
    return this.migrateAllUsers({
      ...options,
      validateOnly: true,
      dryRun: false,
      backupBeforeMigration: false
    });
  }

  /**
   * Perform a dry run migration
   * @param options - Migration options
   * @returns Promise<MigrationResult> - Dry run results
   */
  static async dryRunMigration(options: { batchSize?: number } = {}): Promise<MigrationResult> {
    return this.migrateAllUsers({
      ...options,
      dryRun: true,
      validateOnly: false,
      backupBeforeMigration: false
    });
  }

  /**
   * Get migration statistics
   * @returns Promise<object> - Migration statistics
   */
  static async getMigrationStats(): Promise<{
    totalUsers: number;
    usersWithGamificationData: number;
    usersWithValidData: number;
    usersWithInvalidData: number;
    commonIssues: string[];
  }> {
    const totalUsers = await UserModel.countDocuments();
    const usersWithGamificationData = await UserModel.countDocuments({
      gamification: { $exists: true, $ne: null }
    });

    let usersWithValidData = 0;
    let usersWithInvalidData = 0;
    const commonIssues: string[] = [];

    // Sample validation (check first 100 users)
    const sampleUsers = await UserModel.find({
      gamification: { $exists: true, $ne: null }
    })
    .select('gamification')
    .limit(100)
    .lean();

    for (const user of sampleUsers) {
      try {
        const normalizedData = this.normalizeGamificationData(user.gamification);
        GamificationPersistenceService.validateGamificationData(normalizedData);
        usersWithValidData++;
      } catch (error) {
        usersWithInvalidData++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (!commonIssues.includes(errorMessage)) {
          commonIssues.push(errorMessage);
        }
      }
    }

    return {
      totalUsers,
      usersWithGamificationData,
      usersWithValidData,
      usersWithInvalidData,
      commonIssues
    };
  }
}
/**
 * Gamification Persistence Service - Atomic database operations and error recovery
 * Handles data persistence, validation, backup, and recovery for gamification data
 */

import UserModel from '@/lib/models/server/user';
import { 
  GamificationData, 
  XPTransaction, 
  Badge, 
  XPAction,
  XPAwardResult 
} from '@/types/gamification';
import { BadgeService } from './badges';
import { XPService } from './xp';

// Error types for better error handling
export enum GamificationErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONCURRENCY_ERROR = 'CONCURRENCY_ERROR',
  BACKUP_ERROR = 'BACKUP_ERROR',
  RECOVERY_ERROR = 'RECOVERY_ERROR',
  RETRY_EXHAUSTED = 'RETRY_EXHAUSTED'
}

export class GamificationError extends Error {
  constructor(
    message: string,
    public readonly type: GamificationErrorType,
    public readonly originalError?: Error,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'GamificationError';
  }
}

// Backup data structure
export interface GamificationBackup {
  userId: string;
  timestamp: Date;
  data: GamificationData;
  version: number;
  checksum: string;
}

// Transaction context for atomic operations
export interface GamificationTransaction {
  userId: string;
  operations: GamificationOperation[];
  rollbackData?: GamificationData;
  retryCount: number;
  maxRetries: number;
}

export interface GamificationOperation {
  type: 'AWARD_XP' | 'AWARD_BADGE' | 'UPDATE_STREAK' | 'UPDATE_ACTIVITY';
  data: any;
  timestamp: Date;
}

export class GamificationPersistenceService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_MS = 1000;
  private static readonly BACKUP_RETENTION_DAYS = 30;
  private static readonly CONCURRENT_OPERATION_TIMEOUT_MS = 5000;

  // In-memory cache for active transactions to prevent concurrent modifications
  private static activeTransactions = new Map<string, GamificationTransaction>();

  /**
   * Atomically award XP with full error recovery and validation
   * @param userId - The user's UID (Firebase UID)
   * @param action - The XP action
   * @param metadata - Optional metadata
   * @returns Promise<XPAwardResult> - Result of the XP award
   */
  static async awardXPAtomic(
    userId: string,
    action: XPAction,
    metadata?: Record<string, any>
  ): Promise<XPAwardResult> {
    const transaction: GamificationTransaction = {
      userId,
      operations: [{
        type: 'AWARD_XP',
        data: { action, metadata },
        timestamp: new Date()
      }],
      retryCount: 0,
      maxRetries: this.MAX_RETRIES
    };

    return this.executeTransaction(transaction, async (tx) => {
      return this.performXPAward(tx.userId, action, metadata);
    });
  }

  /**
   * Execute a transaction with retry logic and rollback capability
   * @param transaction - The transaction to execute
   * @param operation - The operation to perform
   * @returns Promise<T> - Result of the operation
   */
  private static async executeTransaction<T>(
    transaction: GamificationTransaction,
    operation: (tx: GamificationTransaction) => Promise<T>
  ): Promise<T> {
    // Check for concurrent operations
    if (this.activeTransactions.has(transaction.userId)) {
      throw new GamificationError(
        `Concurrent gamification operation detected for user ${transaction.userId}`,
        GamificationErrorType.CONCURRENCY_ERROR,
        undefined,
        true
      );
    }

    // Mark transaction as active
    this.activeTransactions.set(transaction.userId, transaction);

    try {
      // Create backup before operation
      const backupData = await this.createBackup(transaction.userId);
      transaction.rollbackData = backupData?.data;

      // Execute operation with retry logic
      return await this.retryOperation(async () => {
        return await operation(transaction);
      }, transaction.maxRetries);

    } catch (error) {
      // Attempt rollback if we have backup data
      if (transaction.rollbackData) {
        try {
          await this.rollbackTransaction(transaction.userId, transaction.rollbackData);
        } catch (rollbackError) {
          console.error('Failed to rollback transaction:', rollbackError);
        }
      }

      // Re-throw the original error
      if (error instanceof GamificationError) {
        throw error;
      }

      throw new GamificationError(
        `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        GamificationErrorType.DATABASE_ERROR,
        error instanceof Error ? error : undefined,
        true
      );
    } finally {
      // Clean up active transaction
      this.activeTransactions.delete(transaction.userId);
    }
  }

  /**
   * Perform XP award with validation and atomic database operations
   * @param userId - The user's UID (Firebase UID)
   * @param action - The XP action
   * @param metadata - Optional metadata
   * @returns Promise<XPAwardResult> - Result of the XP award
   */
  private static async performXPAward(
    userId: string,
    action: XPAction,
    metadata?: Record<string, any>
  ): Promise<XPAwardResult> {
    // Get current user data with optimistic locking using UID
    const user = await UserModel.findOne({ uid: userId });
    if (!user) {
      throw new GamificationError(
        `User not found: ${userId}`,
        GamificationErrorType.VALIDATION_ERROR
      );
    }

    // Get current gamification data
    const currentData = user.gamification || this.initializeGamificationData();
    
    // Validate current data
    this.validateGamificationData(currentData);

    // Calculate XP to award
    let xpToAward = XPService.getXPValues()[action];
    if (action === XPAction.LOGIN_STREAK_BONUS && metadata?.streakDays) {
      xpToAward = XPService.calculateStreakBonus(metadata.streakDays);
    }

    // Validate XP award
    if (xpToAward < 0) {
      throw new GamificationError(
        `Invalid XP amount: ${xpToAward}`,
        GamificationErrorType.VALIDATION_ERROR
      );
    }

    // Calculate new values
    const currentLevel = XPService.calculateLevel(currentData.xp);
    const newTotalXP = currentData.xp + xpToAward;
    const newLevel = XPService.calculateLevel(newTotalXP);
    const levelUp = newLevel > currentLevel;

    // Create XP transaction record
    const xpTransaction: XPTransaction = {
      amount: xpToAward,
      action,
      timestamp: new Date(),
      metadata,
    };

    // Update gamification data
    const updatedData: GamificationData = {
      ...currentData,
      xp: newTotalXP,
      level: newLevel,
      xpHistory: [...currentData.xpHistory, xpTransaction],
    };

    // Update activity counts
    this.updateActivityCounts(updatedData, action);

    // Check for newly earned badges
    const newlyEarnedBadges = await BadgeService.checkAndAwardBadges(userId, updatedData);
    
    // Validate badges (prevent duplicates)
    const existingBadgeIds = new Set(updatedData.badges.map(b => b.id));
    const validNewBadges = newlyEarnedBadges.filter(badge => !existingBadgeIds.has(badge.id));
    
    if (validNewBadges.length > 0) {
      updatedData.badges = [...updatedData.badges, ...validNewBadges];
    }

    // Final validation
    this.validateGamificationData(updatedData);

    // Atomic database update with version checking using UID
    const updateResult = await UserModel.findOneAndUpdate(
      { 
        uid: userId,
        // Optimistic concurrency control - ensure data hasn't changed
        'gamification.xp': currentData.xp,
        'gamification.level': currentData.level
      },
      { 
        gamification: updatedData,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updateResult) {
      throw new GamificationError(
        'Concurrent modification detected - data was updated by another process',
        GamificationErrorType.CONCURRENCY_ERROR,
        undefined,
        true
      );
    }

    // Return result
    return {
      xpAwarded: xpToAward,
      totalXP: newTotalXP,
      levelUp,
      newLevel: levelUp ? newLevel : undefined,
      badgesEarned: validNewBadges,
    };
  }

  /**
   * Update activity counts based on action
   * @param gamificationData - Gamification data to update
   * @param action - The action performed
   */
  private static updateActivityCounts(gamificationData: GamificationData, action: XPAction): void {
    switch (action) {
      case XPAction.QUEST_CREATED:
        gamificationData.activityCounts.questsCreated++;
        break;
      case XPAction.QUEST_IN_PROGRESS:
        gamificationData.activityCounts.questsInProgress++;
        break;
      case XPAction.QUEST_COMPLETED:
        gamificationData.activityCounts.questsCompleted++;
        break;
      case XPAction.APP_ADDED:
        gamificationData.activityCounts.appsAdded++;
        break;
      case XPAction.REVIEW_INTERACTION:
        gamificationData.activityCounts.reviewInteractions++;
        break;
    }
  }

  /**
   * Validate gamification data integrity
   * @param data - Gamification data to validate
   * @throws GamificationError if validation fails
   */
  static validateGamificationData(data: GamificationData): void {
    // Validate XP is non-negative
    if (data.xp < 0) {
      throw new GamificationError(
        `Invalid XP value: ${data.xp}. XP cannot be negative.`,
        GamificationErrorType.VALIDATION_ERROR
      );
    }

    // Validate level consistency
    const expectedLevel = XPService.calculateLevel(data.xp);
    if (data.level !== expectedLevel) {
      throw new GamificationError(
        `Level inconsistency: expected ${expectedLevel}, got ${data.level}`,
        GamificationErrorType.VALIDATION_ERROR
      );
    }

    // Validate activity counts are non-negative
    const activityCounts = data.activityCounts;
    Object.entries(activityCounts).forEach(([key, value]) => {
      if (value < 0) {
        throw new GamificationError(
          `Invalid activity count for ${key}: ${value}. Cannot be negative.`,
          GamificationErrorType.VALIDATION_ERROR
        );
      }
    });

    // Validate streak data
    if (data.streaks.currentLoginStreak < 0 || data.streaks.longestLoginStreak < 0) {
      throw new GamificationError(
        'Invalid streak data: streaks cannot be negative',
        GamificationErrorType.VALIDATION_ERROR
      );
    }

    // Validate badges don't have duplicates
    const badgeIds = data.badges.map(b => b.id);
    const uniqueBadgeIds = new Set(badgeIds);
    if (badgeIds.length !== uniqueBadgeIds.size) {
      throw new GamificationError(
        'Duplicate badges detected in gamification data',
        GamificationErrorType.VALIDATION_ERROR
      );
    }

    // Validate XP history is sorted by timestamp
    for (let i = 1; i < data.xpHistory.length; i++) {
      if (data.xpHistory[i].timestamp < data.xpHistory[i - 1].timestamp) {
        throw new GamificationError(
          'XP history is not properly sorted by timestamp',
          GamificationErrorType.VALIDATION_ERROR
        );
      }
    }
  }

  /**
   * Create a backup of user's gamification data
   * @param userId - The user's UID (Firebase UID)
   * @returns Promise<GamificationBackup | null> - Backup data or null if user not found
   */
  static async createBackup(userId: string): Promise<GamificationBackup | null> {
    try {
      const user = await UserModel.findOne({ uid: userId });
      if (!user || !user.gamification) {
        return null;
      }

      const backup: GamificationBackup = {
        userId,
        timestamp: new Date(),
        data: { ...user.gamification },
        version: 1,
        checksum: this.calculateChecksum(user.gamification)
      };

      return backup;
    } catch (error) {
      throw new GamificationError(
        `Failed to create backup for user ${userId}`,
        GamificationErrorType.BACKUP_ERROR,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Rollback gamification data to a previous state
   * @param userId - The user's UID (Firebase UID)
   * @param backupData - The backup data to restore
   */
  private static async rollbackTransaction(userId: string, backupData: GamificationData): Promise<void> {
    try {
      await UserModel.findOneAndUpdate(
        { uid: userId },
        { 
          gamification: backupData,
          updatedAt: new Date()
        },
        { runValidators: true }
      );
    } catch (error) {
      throw new GamificationError(
        `Failed to rollback transaction for user ${userId}`,
        GamificationErrorType.RECOVERY_ERROR,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Recover gamification data from backup
   * @param userId - The user's ID
   * @param backup - The backup to restore from
   * @returns Promise<boolean> - True if recovery was successful
   */
  static async recoverFromBackup(userId: string, backup: GamificationBackup): Promise<boolean> {
    try {
      // Validate backup integrity
      const calculatedChecksum = this.calculateChecksum(backup.data);
      if (calculatedChecksum !== backup.checksum) {
        throw new GamificationError(
          'Backup data integrity check failed',
          GamificationErrorType.RECOVERY_ERROR
        );
      }

      // Validate backup data
      this.validateGamificationData(backup.data);

      // Restore data
      await UserModel.findOneAndUpdate(
        { uid: userId },
        { 
          gamification: backup.data,
          updatedAt: new Date()
        },
        { runValidators: true }
      );

      return true;
    } catch (error) {
      throw new GamificationError(
        `Failed to recover from backup for user ${userId}`,
        GamificationErrorType.RECOVERY_ERROR,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Retry an operation with exponential backoff
   * @param operation - The operation to retry
   * @param maxRetries - Maximum number of retries
   * @returns Promise<T> - Result of the operation
   */
  private static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry validation errors
        if (error instanceof GamificationError && 
            error.type === GamificationErrorType.VALIDATION_ERROR) {
          throw error;
        }

        // Don't retry if this is the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw new GamificationError(
      `Operation failed after ${maxRetries + 1} attempts`,
      GamificationErrorType.RETRY_EXHAUSTED,
      lastError
    );
  }

  /**
   * Calculate checksum for data integrity verification
   * @param data - The data to calculate checksum for
   * @returns string - Checksum value
   */
  private static calculateChecksum(data: GamificationData): string {
    // Simple checksum calculation - in production, use a proper hash function
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Initialize default gamification data
   * @returns GamificationData - Default data
   */
  private static initializeGamificationData(): GamificationData {
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
   * Sleep utility for retry delays
   * @param ms - Milliseconds to sleep
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user's gamification data with error recovery
   * @param userId - The user's UID (Firebase UID)
   * @returns Promise<GamificationData> - User's gamification data
   */
  static async getUserGamificationDataSafe(userId: string): Promise<GamificationData> {
    return this.retryOperation(async () => {
      console.log('a1');
      const res = await UserModel.findOne({ uid: userId });
      console.log('a2');
      const user = res.toObject();
      if (!user) {
        throw new GamificationError(
          `User not found: ${userId}`,
          GamificationErrorType.VALIDATION_ERROR
        );
      }
      console.log('a3');

      const data = user.gamification || this.initializeGamificationData();
      console.log('a4');
      // Validate data integrity
      try {
        this.validateGamificationData(data);
        console.log('a5');
      } catch (validationError) {
        console.log('a6');
        // If validation fails, try to recover with default data
        console.warn(`Gamification data validation failed for user ${userId}, initializing default data`);
        const defaultData = this.initializeGamificationData();
        console.log('a7');
        // Save the corrected data
        await UserModel.findOneAndUpdate({ uid: userId }, {
          gamification: defaultData,
          updatedAt: new Date()
        });
        console.log('a8');
        return defaultData;
      }
      console.log('a9',data);
      return data;
    }, this.MAX_RETRIES);
  }

  /**
   * Resolve data conflicts in favor of the user (higher XP/more badges)
   * @param localData - Local gamification data
   * @param remoteData - Remote gamification data
   * @returns GamificationData - Resolved data
   */
  static resolveDataConflicts(
    localData: GamificationData,
    remoteData: GamificationData
  ): GamificationData {
    // Use higher XP value
    const resolvedXP = Math.max(localData.xp, remoteData.xp);
    const resolvedLevel = XPService.calculateLevel(resolvedXP);

    // Merge badges (keep all unique badges)
    const allBadges = [...localData.badges, ...remoteData.badges];
    const uniqueBadges = allBadges.filter((badge, index, array) => 
      array.findIndex(b => b.id === badge.id) === index
    );

    // Use higher activity counts
    const resolvedActivityCounts = {
      questsCreated: Math.max(localData.activityCounts.questsCreated, remoteData.activityCounts.questsCreated),
      questsCompleted: Math.max(localData.activityCounts.questsCompleted, remoteData.activityCounts.questsCompleted),
      questsInProgress: Math.max(localData.activityCounts.questsInProgress, remoteData.activityCounts.questsInProgress),
      appsAdded: Math.max(localData.activityCounts.appsAdded, remoteData.activityCounts.appsAdded),
      reviewInteractions: Math.max(localData.activityCounts.reviewInteractions, remoteData.activityCounts.reviewInteractions),
    };

    // Use higher streak values
    const resolvedStreaks = {
      currentLoginStreak: Math.max(localData.streaks.currentLoginStreak, remoteData.streaks.currentLoginStreak),
      longestLoginStreak: Math.max(localData.streaks.longestLoginStreak, remoteData.streaks.longestLoginStreak),
      lastLoginDate: localData.streaks.lastLoginDate && remoteData.streaks.lastLoginDate
        ? new Date(Math.max(localData.streaks.lastLoginDate.getTime(), remoteData.streaks.lastLoginDate.getTime()))
        : localData.streaks.lastLoginDate || remoteData.streaks.lastLoginDate
    };

    // Merge XP history and sort by timestamp
    const mergedXPHistory = [...localData.xpHistory, ...remoteData.xpHistory]
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      xp: resolvedXP,
      level: resolvedLevel,
      badges: uniqueBadges,
      streaks: resolvedStreaks,
      activityCounts: resolvedActivityCounts,
      xpHistory: mergedXPHistory,
    };
  }

  /**
   * Clean up old backups
   * @param userId - The user's ID
   * @param retentionDays - Number of days to retain backups
   */
  static async cleanupOldBackups(userId: string, retentionDays: number = this.BACKUP_RETENTION_DAYS): Promise<void> {
    // This would be implemented with a proper backup storage system
    // For now, this is a placeholder for the interface
    console.log(`Cleaning up backups older than ${retentionDays} days for user ${userId}`);
  }
}
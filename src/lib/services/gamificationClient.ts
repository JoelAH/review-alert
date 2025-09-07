'use client';

import { XPAwardResult, XPAction } from '@/types/gamification';
import { NotificationService } from './notifications';

/**
 * Client-side gamification service for handling XP notifications and UI updates
 */
export class GamificationClientService {
  /**
   * Handle XP award result from API response and show appropriate notifications
   * @param result - XP award result from server
   * @param action - The action that triggered the XP award
   * @param options - Optional notification options
   */
  static handleXPAwardResult(
    result: XPAwardResult, 
    action: XPAction, 
    options?: { 
      showNotifications?: boolean;
      customMessage?: string;
    }
  ): void {
    const { showNotifications = true } = options || {};
    
    if (!showNotifications) return;

    // Use the notification service to show appropriate notifications
    NotificationService.xpAwardResult(result, action);

    // Show streak milestone notification if this was a streak bonus
    if (action === XPAction.LOGIN_STREAK_BONUS && result.xpAwarded > 0) {
      // Extract streak days from the XP amount (reverse calculation)
      let streakDays = 3; // Default
      if (result.xpAwarded >= 15) streakDays = 14;
      else if (result.xpAwarded >= 10) streakDays = 7;
      else if (result.xpAwarded >= 5) streakDays = 3;
      
      NotificationService.streakMilestone(streakDays, result.xpAwarded);
    }
  }

  /**
   * Handle multiple XP award results (for batch operations)
   * @param results - Array of XP award results
   * @param actions - Corresponding actions for each result
   */
  static handleMultipleXPAwardResults(
    results: Array<{ result: XPAwardResult; action: XPAction }>,
    options?: { showNotifications?: boolean }
  ): void {
    const { showNotifications = true } = options || {};
    
    if (!showNotifications || results.length === 0) return;

    // Handle level ups and badges first (most important)
    results.forEach(({ result, action }) => {
      if (result.levelUp && result.newLevel) {
        NotificationService.levelUp(result.newLevel);
      }
      
      result.badgesEarned.forEach(badge => {
        NotificationService.badgeEarned(badge);
      });
    });

    // Batch XP notifications if multiple results
    if (results.length > 1) {
      const totalXP = results.reduce((sum, { result }) => sum + result.xpAwarded, 0);
      const actions = results.map(({ result, action }) => ({
        action,
        amount: result.xpAwarded,
      }));
      
      NotificationService.batchedXPGained(totalXP, actions);
    } else {
      // Single result, show regular XP notification
      const { result, action } = results[0];
      NotificationService.xpGained(result.xpAwarded, action);
    }
  }

  /**
   * Show XP gain notification for a specific amount and action
   * @param xpAmount - Amount of XP gained
   * @param action - Action that earned the XP
   */
  static showXPGained(xpAmount: number, action: XPAction): void {
    NotificationService.xpGained(xpAmount, action);
  }

  /**
   * Show badge earned notification
   * @param badge - Badge that was earned
   */
  static showBadgeEarned(badge: any): void {
    NotificationService.badgeEarned(badge);
  }

  /**
   * Show level up notification
   * @param newLevel - New level reached
   */
  static showLevelUp(newLevel: number): void {
    NotificationService.levelUp(newLevel);
  }

  /**
   * Show streak milestone notification
   * @param streakDays - Number of consecutive days
   * @param bonusXP - Bonus XP awarded
   */
  static showStreakMilestone(streakDays: number, bonusXP: number): void {
    NotificationService.streakMilestone(streakDays, bonusXP);
  }

  /**
   * Set notification preferences
   * @param preferences - Notification preferences to update
   */
  static setNotificationPreferences(preferences: {
    xpNotifications?: boolean;
    badgeNotifications?: boolean;
    levelUpNotifications?: boolean;
    streakNotifications?: boolean;
    batchNotifications?: boolean;
  }): void {
    NotificationService.setPreferences(preferences);
  }

  /**
   * Get current notification preferences
   */
  static getNotificationPreferences() {
    return NotificationService.getPreferences();
  }

  /**
   * Add XP to notification batch (for rapid successive actions)
   * @param xpAmount - Amount of XP to add to batch
   * @param action - Action that earned the XP
   */
  static addXPToBatch(xpAmount: number, action: XPAction): void {
    NotificationService.addToBatch(xpAmount, action);
  }

  /**
   * Dismiss all gamification notifications
   */
  static dismissAllNotifications(): void {
    NotificationService.dismissAll();
  }

  /**
   * Handle API response that may contain XP award data
   * @param response - API response object
   * @param action - Action that was performed
   * @returns The original response for chaining
   */
  static handleAPIResponse<T extends Record<string, any>>(
    response: T, 
    action: XPAction
  ): T {
    // Check if response contains valid XP award data
    if (response.xpAwarded && 
        typeof response.xpAwarded === 'object' && 
        typeof response.xpAwarded.xpAwarded === 'number') {
      this.handleXPAwardResult(response.xpAwarded as XPAwardResult, action);
    }
    
    return response;
  }

  /**
   * Create a wrapper for API calls that automatically handles XP notifications
   * @param apiCall - Function that makes the API call
   * @param action - XP action associated with this API call
   * @returns Wrapped API call function
   */
  static wrapAPICall<T extends Record<string, any>>(
    apiCall: () => Promise<T>,
    action: XPAction
  ): () => Promise<T> {
    return async () => {
      const response = await apiCall();
      return this.handleAPIResponse(response, action);
    };
  }
}

/**
 * React hook for using gamification client service
 */
export function useGamificationNotifications() {
  return {
    handleXPAwardResult: GamificationClientService.handleXPAwardResult,
    handleMultipleXPAwardResults: GamificationClientService.handleMultipleXPAwardResults,
    showXPGained: GamificationClientService.showXPGained,
    showBadgeEarned: GamificationClientService.showBadgeEarned,
    showLevelUp: GamificationClientService.showLevelUp,
    showStreakMilestone: GamificationClientService.showStreakMilestone,
    setNotificationPreferences: GamificationClientService.setNotificationPreferences,
    getNotificationPreferences: GamificationClientService.getNotificationPreferences,
    addXPToBatch: GamificationClientService.addXPToBatch,
    dismissAllNotifications: GamificationClientService.dismissAllNotifications,
    handleAPIResponse: GamificationClientService.handleAPIResponse,
    wrapAPICall: GamificationClientService.wrapAPICall,
  };
}

export default GamificationClientService;
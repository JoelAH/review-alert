'use client';

import { XPAction, XPAwardResult } from '@/types/gamification';

/**
 * Client-side XP API service for making XP-related API calls
 * This service can be safely imported by client components
 */
export class XPApiService {
  private static readonly API_BASE_URL = '/api/xp';

  /**
   * Award XP to the current user via API call
   * @param action - The action that earned XP
   * @param metadata - Optional metadata about the action
   * @returns Promise<XPAwardResult> - Result of the XP award
   */
  static async awardXP(
    action: XPAction, 
    metadata?: Record<string, any>
  ): Promise<XPAwardResult> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/award`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to award XP: ${response.status}`);
      }

      const result = await response.json();
      return result.xpAwarded;
    } catch (error) {
      console.error('Error awarding XP via API:', error);
      throw error;
    }
  }

  /**
   * Check if the XP API is available
   * @returns Promise<boolean> - True if API is available
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get user-friendly error message for XP operations
   * @param error - Error object
   * @returns string - User-friendly error message
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return 'You need to sign in to earn XP.';
      }
      if (error.message.includes('Invalid XP action')) {
        return 'Invalid action for earning XP.';
      }
      if (error.message.includes('Failed to award XP')) {
        return 'Failed to award XP. Please try again.';
      }
      return error.message;
    }

    return 'An unexpected error occurred while awarding XP.';
  }
}
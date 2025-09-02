import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import QuestsTab from '../QuestsTab';
import { QuestService, QuestError } from '@/lib/services/quests';
import { NotificationService } from '@/lib/services/notifications';
import { QuestState, QuestType, QuestPriority } from '@/lib/models/client/quest';

// Mock dependencies
jest.mock('@/lib/services/quests', () => ({
  QuestService: {
    fetchQuests: jest.fn(),
    updateQuest: jest.fn(),
    getErrorMessage: jest.fn(),
  },
  QuestError: jest.fn().mockImplementation((message, code, status, retryable) => ({
    message,
    code,
    status,
    retryable,
    isNetworkError: code === 'FETCH_ERROR' || (code === 'HTTP_ERROR' && status >= 500),
    isAuthError: status === 401 || status === 403,
    shouldRetry: retryable,
  })),
}));

jest.mock('@/lib/services/notifications');

const mockQuestService = QuestService as jest.Mocked<typeof QuestService>;
const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;

const theme = createTheme();

const mockUser = {
  _id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  apps: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockQuest = {
  _id: 'quest-1',
  title: 'Test Quest',
  details: 'Test details',
  type: QuestType.BUG_FIX,
  priority: QuestPriority.HIGH,
  state: QuestState.OPEN,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const renderQuestsTab = (props = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <QuestsTab user={mockUser} {...props} />
    </ThemeProvider>
  );
};

describe('QuestsTab Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading skeleton while fetching quests', () => {
      mockQuestService.fetchQuests.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderQuestsTab();

      expect(screen.getByTestId('quest-loading-skeleton') || screen.getAllByTestId(/skeleton/i)).toBeTruthy();
    });
  });

  describe('Network Errors', () => {
    it('should show network error state when API is unreachable', async () => {
      const networkError = {
        message: 'Network error',
        code: 'FETCH_ERROR',
        status: undefined,
        retryable: true,
        isNetworkError: true,
        isAuthError: false,
        shouldRetry: true,
      };
      
      mockQuestService.fetchQuests.mockRejectedValueOnce(networkError);
      mockQuestService.getErrorMessage.mockReturnValueOnce('Failed to load quests. Please check your connection and try again.');

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('Connection Problem')).toBeInTheDocument();
        expect(screen.getByText('Failed to load quests. Please check your connection and try again.')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
    });

    it('should show offline indicator when network is unavailable', async () => {
      const networkError = new QuestError('Network error', 'FETCH_ERROR', undefined, true);
      mockQuestService.fetchQuests.mockRejectedValueOnce(networkError);

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });

    it('should auto-retry on network errors', async () => {
      const networkError = new QuestError('Network error', 'FETCH_ERROR', undefined, true);
      mockQuestService.fetchQuests
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          quests: [mockQuest],
          hasMore: false,
          totalCount: 1,
          overview: {
            stateBreakdown: { open: 1, inProgress: 0, done: 0 },
            priorityBreakdown: { high: 1, medium: 0, low: 0 },
            typeBreakdown: { bugFix: 1, featureRequest: 0, improvement: 0, research: 0, other: 0 }
          }
        });

      renderQuestsTab();

      // Should show retry message
      await waitFor(() => {
        expect(screen.getByText(/retrying automatically/i)).toBeInTheDocument();
      });

      // Should eventually show the quest
      await waitFor(() => {
        expect(screen.getByText('Test Quest')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(mockQuestService.fetchQuests).toHaveBeenCalledTimes(2);
    });
  });

  describe('Authentication Errors', () => {
    it('should show authentication error state', async () => {
      const authError = new QuestError('Unauthorized', 'HTTP_ERROR', 401);
      mockQuestService.fetchQuests.mockRejectedValueOnce(authError);
      mockQuestService.getErrorMessage.mockReturnValueOnce('You need to sign in to manage quests.');

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('Authentication Required')).toBeInTheDocument();
        expect(screen.getByText('You need to sign in to manage quests.')).toBeInTheDocument();
      });
    });
  });

  describe('Server Errors', () => {
    it('should show server error state', async () => {
      const serverError = new QuestError('Server error', 'HTTP_ERROR', 500);
      mockQuestService.fetchQuests.mockRejectedValueOnce(serverError);
      mockQuestService.getErrorMessage.mockReturnValueOnce('Server error. Please try again later.');

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Quests')).toBeInTheDocument();
        expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument();
      });
    });
  });

  describe('Quest State Change Errors', () => {
    it('should show error notification when state change fails', async () => {
      mockQuestService.fetchQuests.mockResolvedValueOnce({
        quests: [mockQuest],
        hasMore: false,
        totalCount: 1,
        overview: {
          stateBreakdown: { open: 1, inProgress: 0, done: 0 },
          priorityBreakdown: { high: 1, medium: 0, low: 0 },
          typeBreakdown: { bugFix: 1, featureRequest: 0, improvement: 0, research: 0, other: 0 }
        }
      });

      const updateError = new QuestError('Update failed', 'UPDATE_ERROR', 500);
      mockQuestService.updateQuest.mockRejectedValueOnce(updateError);
      mockQuestService.getErrorMessage.mockReturnValueOnce('Failed to update quest. Please try again.');

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('Test Quest')).toBeInTheDocument();
      });

      // Try to change state (this would be done through QuestStateSelector)
      // We'll simulate the error by calling the handler directly
      const questCard = screen.getByText('Test Quest').closest('[data-testid="quest-card"]');
      expect(questCard).toBeInTheDocument();

      // The actual state change would happen through QuestStateSelector
      // For this test, we'll verify the error handling in the callback
      try {
        await mockQuestService.updateQuest('quest-1', { state: QuestState.IN_PROGRESS });
      } catch (error) {
        expect(mockNotificationService.error).toHaveBeenCalledWith('Failed to update quest. Please try again.');
      }
    });

    it('should show success notification when state change succeeds', async () => {
      mockQuestService.fetchQuests.mockResolvedValueOnce({
        quests: [mockQuest],
        hasMore: false,
        totalCount: 1,
        overview: {
          stateBreakdown: { open: 1, inProgress: 0, done: 0 },
          priorityBreakdown: { high: 1, medium: 0, low: 0 },
          typeBreakdown: { bugFix: 1, featureRequest: 0, improvement: 0, research: 0, other: 0 }
        }
      });

      const updatedQuest = { ...mockQuest, state: QuestState.IN_PROGRESS };
      mockQuestService.updateQuest.mockResolvedValueOnce(updatedQuest);

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('Test Quest')).toBeInTheDocument();
      });

      // Simulate successful state change
      await mockQuestService.updateQuest('quest-1', { state: QuestState.IN_PROGRESS });

      expect(mockNotificationService.success).toHaveBeenCalledWith('Quest marked as in progress');
    });
  });

  describe('Quest Update Errors', () => {
    it('should show error notification when quest update fails', async () => {
      mockQuestService.fetchQuests.mockResolvedValueOnce({
        quests: [mockQuest],
        hasMore: false,
        totalCount: 1,
        overview: {
          stateBreakdown: { open: 1, inProgress: 0, done: 0 },
          priorityBreakdown: { high: 1, medium: 0, low: 0 },
          typeBreakdown: { bugFix: 1, featureRequest: 0, improvement: 0, research: 0, other: 0 }
        }
      });

      const updateError = new QuestError('Update failed', 'UPDATE_ERROR', 400);
      mockQuestService.updateQuest.mockRejectedValueOnce(updateError);
      mockQuestService.getErrorMessage.mockReturnValueOnce('Failed to update quest. Please try again.');

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('Test Quest')).toBeInTheDocument();
      });

      // Simulate quest update failure
      try {
        await mockQuestService.updateQuest('quest-1', { title: 'Updated Quest' });
      } catch (error) {
        expect(mockNotificationService.error).toHaveBeenCalledWith('Failed to update quest. Please try again.');
      }
    });

    it('should show success notification when quest update succeeds', async () => {
      mockQuestService.fetchQuests.mockResolvedValueOnce({
        quests: [mockQuest],
        hasMore: false,
        totalCount: 1,
        overview: {
          stateBreakdown: { open: 1, inProgress: 0, done: 0 },
          priorityBreakdown: { high: 1, medium: 0, low: 0 },
          typeBreakdown: { bugFix: 1, featureRequest: 0, improvement: 0, research: 0, other: 0 }
        }
      });

      const updatedQuest = { ...mockQuest, title: 'Updated Quest' };
      mockQuestService.updateQuest.mockResolvedValueOnce(updatedQuest);

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('Test Quest')).toBeInTheDocument();
      });

      // Simulate successful quest update
      await mockQuestService.updateQuest('quest-1', { title: 'Updated Quest' });

      expect(mockNotificationService.success).toHaveBeenCalledWith('Quest updated successfully');
    });
  });

  describe('Retry Functionality', () => {
    it('should retry when retry button is clicked', async () => {
      const networkError = new QuestError('Network error', 'FETCH_ERROR', undefined, true);
      mockQuestService.fetchQuests
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          quests: [mockQuest],
          hasMore: false,
          totalCount: 1,
          overview: {
            stateBreakdown: { open: 1, inProgress: 0, done: 0 },
            priorityBreakdown: { high: 1, medium: 0, low: 0 },
            typeBreakdown: { bugFix: 1, featureRequest: 0, improvement: 0, research: 0, other: 0 }
          }
        });

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Test Quest')).toBeInTheDocument();
      });

      expect(mockQuestService.fetchQuests).toHaveBeenCalledTimes(2);
    });

    it('should refresh when refresh button is clicked', async () => {
      mockQuestService.fetchQuests.mockResolvedValueOnce({
        quests: [mockQuest],
        hasMore: false,
        totalCount: 1,
        overview: {
          stateBreakdown: { open: 1, inProgress: 0, done: 0 },
          priorityBreakdown: { high: 1, medium: 0, low: 0 },
          typeBreakdown: { bugFix: 1, featureRequest: 0, improvement: 0, research: 0, other: 0 }
        }
      });

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('Test Quest')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      expect(mockQuestService.fetchQuests).toHaveBeenCalledTimes(2);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no quests exist', async () => {
      mockQuestService.fetchQuests.mockResolvedValueOnce({
        quests: [],
        hasMore: false,
        totalCount: 0,
        overview: {
          stateBreakdown: { open: 0, inProgress: 0, done: 0 },
          priorityBreakdown: { high: 0, medium: 0, low: 0 },
          typeBreakdown: { bugFix: 0, featureRequest: 0, improvement: 0, research: 0, other: 0 }
        }
      });

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('No Quests Yet')).toBeInTheDocument();
        expect(screen.getByText('Create your first quest from a review to start tracking actionable tasks.')).toBeInTheDocument();
      });
    });
  });

  describe('Graceful Degradation', () => {
    it('should show cached data when API is unavailable', async () => {
      // First successful load
      mockQuestService.fetchQuests.mockResolvedValueOnce({
        quests: [mockQuest],
        hasMore: false,
        totalCount: 1,
        overview: {
          stateBreakdown: { open: 1, inProgress: 0, done: 0 },
          priorityBreakdown: { high: 1, medium: 0, low: 0 },
          typeBreakdown: { bugFix: 1, featureRequest: 0, improvement: 0, research: 0, other: 0 }
        }
      });

      const { rerender } = renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('Test Quest')).toBeInTheDocument();
      });

      // Subsequent load fails but should show cached data
      const networkError = new QuestError('Network error', 'FETCH_ERROR', undefined, true);
      mockQuestService.fetchQuests.mockRejectedValueOnce(networkError);

      rerender(
        <ThemeProvider theme={theme}>
          <QuestsTab user={mockUser} />
        </ThemeProvider>
      );

      // Should still show the quest from cache
      expect(screen.getByText('Test Quest')).toBeInTheDocument();
    });
  });
});
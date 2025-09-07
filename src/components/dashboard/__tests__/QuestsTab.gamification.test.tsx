import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import QuestsTab from '../QuestsTab';
import { QuestService, QuestError } from '@/lib/services/quests';
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

// Mock the GamificationDisplay component
jest.mock('../GamificationDisplay', () => {
  return function MockGamificationDisplay({ userId }: { userId: string }) {
    return <div data-testid="gamification-display">Gamification Display for {userId}</div>;
  };
});

const mockQuestService = QuestService as jest.Mocked<typeof QuestService>;

const theme = createTheme();

const mockUser = {
  _id: 'user-1',
  uid: 'user-uid-123',
  email: 'test@example.com',
  apps: [],
  gamification: {
    xp: 150,
    level: 2,
    badges: [],
    streaks: {
      currentLoginStreak: 3,
      longestLoginStreak: 7,
    },
    activityCounts: {
      questsCreated: 5,
      questsCompleted: 3,
      questsInProgress: 1,
      appsAdded: 2,
      reviewInteractions: 10,
    },
    xpHistory: [],
  },
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

const renderQuestsTab = (user = mockUser) => {
  return render(
    <ThemeProvider theme={theme}>
      <QuestsTab user={user} />
    </ThemeProvider>
  );
};

describe('QuestsTab Gamification Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Gamification Display', () => {
    it('should show gamification display when user has quests', async () => {
      mockQuestService.fetchQuests.mockResolvedValue({
        quests: [mockQuest],
        total: 1,
      });

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('Test Quest')).toBeInTheDocument();
      });

      // Should show gamification display
      expect(screen.getByTestId('gamification-display')).toBeInTheDocument();
      expect(screen.getByText('Gamification Display for user-uid-123')).toBeInTheDocument();
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
    });

    it('should not show gamification display when there are no quests', async () => {
      mockQuestService.fetchQuests.mockResolvedValue({
        quests: [],
        total: 0,
      });

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('No Quests Yet')).toBeInTheDocument();
      });

      // Should not show gamification display
      expect(screen.queryByTestId('gamification-display')).not.toBeInTheDocument();
      expect(screen.queryByText('Your Progress')).not.toBeInTheDocument();
    });

    it('should not show gamification display when there is an error', async () => {
      const error = new QuestError('Network error', 'FETCH_ERROR', 500, true);
      mockQuestService.fetchQuests.mockRejectedValue(error);
      mockQuestService.getErrorMessage.mockReturnValue('Failed to load quests');

      renderQuestsTab();

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Quests')).toBeInTheDocument();
      });

      // Should not show gamification display
      expect(screen.queryByTestId('gamification-display')).not.toBeInTheDocument();
      expect(screen.queryByText('Your Progress')).not.toBeInTheDocument();
    });

    it('should not show gamification display when user is null', async () => {
      mockQuestService.fetchQuests.mockResolvedValue({
        quests: [],
        total: 0,
      });

      renderQuestsTab(null);

      // Should not show gamification display
      expect(screen.queryByTestId('gamification-display')).not.toBeInTheDocument();
      expect(screen.queryByText('Your Progress')).not.toBeInTheDocument();
    });

    it('should not show gamification display during loading', async () => {
      // Mock a delayed response
      mockQuestService.fetchQuests.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ quests: [mockQuest], total: 1 }), 100))
      );

      renderQuestsTab();

      // During loading, should not show gamification display
      expect(screen.queryByTestId('gamification-display')).not.toBeInTheDocument();
      expect(screen.queryByText('Your Progress')).not.toBeInTheDocument();

      // After loading, should show gamification display
      await waitFor(() => {
        expect(screen.getByText('Test Quest')).toBeInTheDocument();
      });

      expect(screen.getByTestId('gamification-display')).toBeInTheDocument();
    });
  });
});
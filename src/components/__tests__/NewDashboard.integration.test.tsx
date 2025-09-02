import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NewDashboard from '@/components/NewDashboard';
import { User } from '@/lib/models/client/user';
import { Quest, QuestState, QuestType, QuestPriority } from '@/lib/models/client/quest';
import { Review } from '@/lib/models/client/review';
import { QuestService } from '@/lib/services/quests';
import { useReviews } from '@/lib/hooks/useReviews';

// Mock the services and hooks
jest.mock('@/lib/services/quests');
jest.mock('@/lib/hooks/useReviews');
jest.mock('@/lib/hooks/useAuth', () => ({
    useAuth: () => ({ isAuthenticated: true })
}));

// Mock the dashboard components
jest.mock('@/components/dashboard/FeedTab', () => {
    return function MockFeedTab({ user, highlightedReviewId, onQuestCountChange }: any) {
        return (
            <div role="tabpanel" aria-labelledby="dashboard-tab-0" data-testid="feed-tab">
                <div>Feed Tab Content</div>
                {highlightedReviewId && <div data-testid="highlighted-review">Review {highlightedReviewId}</div>}
                <button onClick={() => onQuestCountChange?.()}>Create Quest</button>
                <div>Cannot login with Google account</div>
                <button role="button" aria-label="create quest">Create Quest</button>
            </div>
        );
    };
});

jest.mock('@/components/dashboard/QuestsTab', () => {
    return function MockQuestsTab({ user, onViewReview, onQuestCountChange }: any) {
        return (
            <div role="tabpanel" aria-labelledby="dashboard-tab-1" data-testid="quests-tab">
                <div>Quest Management</div>
                <div data-testid="quest-card" data-quest-id="quest1">
                    <div>Fix login bug</div>
                    <button role="button" aria-label="open">Open</button>
                    <button role="button" aria-label="view review" onClick={() => onViewReview?.('review1')}>View Review</button>
                </div>
                <button onClick={() => onQuestCountChange?.()}>Update Quest</button>
            </div>
        );
    };
});

jest.mock('@/components/dashboard/CommandCenterTab', () => {
    return function MockCommandCenterTab({ user }: any) {
        return (
            <div role="tabpanel" aria-labelledby="dashboard-tab-2" data-testid="command-center-tab">
                <div>Command Center Content</div>
            </div>
        );
    };
});

const mockQuestService = QuestService as jest.Mocked<typeof QuestService>;
const mockUseReviews = useReviews as jest.MockedFunction<typeof useReviews>;

// Test data
const mockUser: User = {
    _id: 'user1',
    email: 'test@example.com',
    apps: [
        {
            _id: 'app1',
            store: 'GooglePlay',
            url: 'https://play.google.com/store/apps/details?id=com.test.app',
            name: 'Test App'
        }
    ]
};

const mockQuests: Quest[] = [
    {
        _id: 'quest1',
        user: 'user1',
        reviewId: 'review1',
        title: 'Fix login bug',
        details: 'Users cannot login with Google',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
        state: QuestState.OPEN,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    },
    {
        _id: 'quest2',
        user: 'user1',
        title: 'Add dark mode',
        type: QuestType.FEATURE_REQUEST,
        priority: QuestPriority.MEDIUM,
        state: QuestState.IN_PROGRESS,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
    },
    {
        _id: 'quest3',
        user: 'user1',
        title: 'Improve performance',
        type: QuestType.IMPROVEMENT,
        priority: QuestPriority.LOW,
        state: QuestState.DONE,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03')
    }
];

const mockReviews: Review[] = [
    {
        _id: 'review1',
        user: 'user1',
        appId: 'app1',
        content: 'Cannot login with Google account',
        rating: 2,
        platform: 'GooglePlay',
        quest: 'BUG',
        priority: 'HIGH',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    }
];

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

describe('NewDashboard Quest Management Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock QuestService
        mockQuestService.fetchQuests.mockResolvedValue({
            quests: mockQuests,
            totalCount: mockQuests.length
        });
        
        // Mock useReviews hook
        mockUseReviews.mockReturnValue({
            reviews: mockReviews,
            loading: false,
            initialLoading: false,
            error: null,
            hasMore: false,
            totalCount: mockReviews.length,
            refreshReviews: jest.fn(),
            loadMore: jest.fn(),
            updateFilters: jest.fn(),
            clearFilters: jest.fn()
        });
    });

    it('should display quest count badges on quest tab', async () => {
        renderWithTheme(<NewDashboard user={mockUser} />);

        // Wait for quest counts to load
        await waitFor(() => {
            const questTab = screen.getByRole('tab', { name: /quests/i });
            expect(questTab).toBeInTheDocument();
        });

        // Check that badge shows count of open + in progress quests (2)
        const badge = screen.getByText('2');
        expect(badge).toBeInTheDocument();
    });

    it('should refresh quest counts when switching to quest tab', async () => {
        const user = userEvent.setup();
        renderWithTheme(<NewDashboard user={mockUser} />);

        // Wait for initial load
        await waitFor(() => {
            expect(mockQuestService.fetchQuests).toHaveBeenCalledTimes(1);
        });

        // Click on quest tab
        const questTab = screen.getByRole('tab', { name: /quests/i });
        await user.click(questTab);

        // Should call fetchQuests again when switching to quest tab
        await waitFor(() => {
            expect(mockQuestService.fetchQuests).toHaveBeenCalledTimes(2);
        });
    });

    it('should update quest counts when quest state changes', async () => {
        const user = userEvent.setup();
        
        renderWithTheme(<NewDashboard user={mockUser} />);

        // Switch to quest tab
        const questTab = screen.getByRole('tab', { name: /quests/i });
        await user.click(questTab);

        // Wait for quests to load
        await waitFor(() => {
            expect(screen.getByText('Fix login bug')).toBeInTheDocument();
        });

        // Find and click update quest button (simulating quest state change)
        const updateQuestButton = screen.getByText('Update Quest');
        await user.click(updateQuestButton);

        // Quest counts should be refreshed
        await waitFor(() => {
            expect(mockQuestService.fetchQuests).toHaveBeenCalledTimes(3); // Initial + tab switch + after update
        });
    });

    it('should navigate between tabs and maintain state', async () => {
        const user = userEvent.setup();
        renderWithTheme(<NewDashboard user={mockUser} />);

        // Start on Feed tab
        expect(screen.getByTestId('feed-tab')).toBeInTheDocument();

        // Switch to Quest tab
        const questTab = screen.getByRole('tab', { name: /quests/i });
        await user.click(questTab);

        await waitFor(() => {
            expect(screen.getByTestId('quests-tab')).toBeInTheDocument();
            expect(screen.getByText('Quest Management')).toBeInTheDocument();
        });

        // Switch to Command Center tab
        const commandCenterTab = screen.getByRole('tab', { name: /command center/i });
        await user.click(commandCenterTab);

        await waitFor(() => {
            expect(screen.getByTestId('command-center-tab')).toBeInTheDocument();
        });

        // Switch back to Feed tab
        const feedTab = screen.getByRole('tab', { name: /feed/i });
        await user.click(feedTab);

        await waitFor(() => {
            expect(screen.getByTestId('feed-tab')).toBeInTheDocument();
        });
    });

    it('should handle quest creation from review card and update counts', async () => {
        const user = userEvent.setup();
        
        renderWithTheme(<NewDashboard user={mockUser} />);

        // Should be on Feed tab by default
        await waitFor(() => {
            expect(screen.getByText('Cannot login with Google account')).toBeInTheDocument();
        });

        // Find and click "Create Quest" button on review card
        const createQuestButtons = screen.getAllByRole('button', { name: /create quest/i });
        await user.click(createQuestButtons[0]);

        // Quest counts should be refreshed after creation
        await waitFor(() => {
            expect(mockQuestService.fetchQuests).toHaveBeenCalledTimes(2); // Initial + after creation
        });
    });

    it('should handle view review navigation from quest tab', async () => {
        const user = userEvent.setup();
        renderWithTheme(<NewDashboard user={mockUser} />);

        // Switch to Quest tab
        const questTab = screen.getByRole('tab', { name: /quests/i });
        await user.click(questTab);

        // Wait for quests to load
        await waitFor(() => {
            expect(screen.getByText('Fix login bug')).toBeInTheDocument();
        });

        // Find and click "View Review" button on quest card
        const questCard = screen.getByText('Fix login bug').closest('[data-testid="quest-card"]');
        const viewReviewButton = within(questCard!).getByRole('button', { name: /view review/i });
        await user.click(viewReviewButton);

        // Should switch back to Feed tab and highlight the review
        await waitFor(() => {
            expect(screen.getByTestId('feed-tab')).toBeInTheDocument();
        });

        // The review should be highlighted (this would depend on the highlighting implementation)
        expect(screen.getByTestId('highlighted-review')).toBeInTheDocument();
    });

    it('should handle errors gracefully and not break navigation', async () => {
        const user = userEvent.setup();
        
        // Mock quest service error
        mockQuestService.fetchQuests.mockRejectedValueOnce(new Error('Network error'));
        
        renderWithTheme(<NewDashboard user={mockUser} />);

        // Quest tab should still be clickable even if quest loading fails
        const questTab = screen.getByRole('tab', { name: /quests/i });
        await user.click(questTab);

        // Should show quest tab (error handling is done within the tab)
        await waitFor(() => {
            expect(screen.getByTestId('quests-tab')).toBeInTheDocument();
        });

        // Navigation should still work
        const feedTab = screen.getByRole('tab', { name: /feed/i });
        await user.click(feedTab);

        await waitFor(() => {
            expect(screen.getByTestId('feed-tab')).toBeInTheDocument();
        });
    });

    it('should clean up state when user changes', async () => {
        const { rerender } = renderWithTheme(<NewDashboard user={mockUser} />);

        // Wait for initial quest load
        await waitFor(() => {
            expect(mockQuestService.fetchQuests).toHaveBeenCalledTimes(1);
        });

        // Change user to null (logout)
        rerender(
            <ThemeProvider theme={theme}>
                <NewDashboard user={null} />
            </ThemeProvider>
        );

        // Quest counts should be reset
        await waitFor(() => {
            const questTab = screen.getByRole('tab', { name: /quests/i });
            // Badge should not be visible when no user
            expect(within(questTab).queryByText(/\d+/)).not.toBeInTheDocument();
        });
    });

    it('should handle mobile responsive behavior', async () => {
        // Mock mobile viewport
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 600,
        });

        const user = userEvent.setup();
        renderWithTheme(<NewDashboard user={mockUser} />);

        // Tabs should be rendered (mobile behavior is handled by MUI internally)
        const tabsContainer = screen.getByRole('tablist');
        expect(tabsContainer).toBeInTheDocument();

        // Navigation should still work on mobile
        const questTab = screen.getByRole('tab', { name: /quests/i });
        await user.click(questTab);

        await waitFor(() => {
            expect(screen.getByTestId('quests-tab')).toBeInTheDocument();
        });
    });
});
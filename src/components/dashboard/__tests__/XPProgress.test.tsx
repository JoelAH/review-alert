import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/app/theme';
import XPProgress from '../XPProgress';
import { XPAction, XPTransaction } from '@/types/gamification';

// Mock data
const mockTransactions: XPTransaction[] = [
    {
        amount: 15,
        action: XPAction.QUEST_COMPLETED,
        timestamp: new Date('2024-01-15T10:00:00Z'),
        metadata: { questId: 'quest1' }
    },
    {
        amount: 10,
        action: XPAction.QUEST_CREATED,
        timestamp: new Date('2024-01-14T15:30:00Z'),
        metadata: { questId: 'quest2' }
    },
    {
        amount: 20,
        action: XPAction.APP_ADDED,
        timestamp: new Date('2024-01-13T09:15:00Z'),
        metadata: { appId: 'app1' }
    },
    {
        amount: 8,
        action: XPAction.REVIEW_INTERACTION,
        timestamp: new Date('2024-01-12T14:45:00Z'),
        metadata: { reviewId: 'review1' }
    },
    {
        amount: 10,
        action: XPAction.LOGIN_STREAK_BONUS,
        timestamp: new Date('2024-01-11T08:00:00Z'),
        metadata: { streakDays: 7 }
    }
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider theme={theme}>
        {children}
    </ThemeProvider>
);

describe('XPProgress Component', () => {
    const defaultProps = {
        currentXP: 350,
        currentLevel: 3,
        xpForNextLevel: 150,
        recentTransactions: mockTransactions,
    };

    beforeEach(() => {
        // Mock Date.now() for consistent time-based tests
        jest.spyOn(Date, 'now').mockImplementation(() => new Date('2024-01-15T12:00:00Z').getTime());
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    describe('Basic Rendering', () => {
        it('renders XP progress component with correct level and XP', () => {
            render(
                <TestWrapper>
                    <XPProgress {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByText('Level 3')).toBeInTheDocument();
            expect(screen.getByText('350 XP')).toBeInTheDocument();
            expect(screen.getByText('Progress to Level 4')).toBeInTheDocument();
            expect(screen.getByText('150 XP to go')).toBeInTheDocument();
        });

        it('renders progress bar with correct percentage', () => {
            render(
                <TestWrapper>
                    <XPProgress {...defaultProps} />
                </TestWrapper>
            );

            // Level 3 starts at 250 XP, Level 4 at 500 XP
            // Current XP: 350, so progress in level: 350 - 250 = 100
            // XP needed for level: 500 - 250 = 250
            // Progress percentage: (100 / 250) * 100 = 40%
            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toHaveAttribute('aria-valuenow', '40');
        });

        it('displays recent activity section', () => {
            render(
                <TestWrapper>
                    <XPProgress {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByText('Recent Activity')).toBeInTheDocument();
            expect(screen.getByLabelText('Show recent activity')).toBeInTheDocument();
        });
    });

    describe('Maximum Level Handling', () => {
        it('displays maximum level reached message when at max level', () => {
            const maxLevelProps = {
                ...defaultProps,
                currentXP: 15000,
                currentLevel: 11,
                xpForNextLevel: 0,
            };

            render(
                <TestWrapper>
                    <XPProgress {...maxLevelProps} />
                </TestWrapper>
            );

            expect(screen.getByText('Maximum Level Reached!')).toBeInTheDocument();
            expect(screen.getByText("You've mastered ReviewQuest")).toBeInTheDocument();
            expect(screen.queryByText('XP to go')).not.toBeInTheDocument();
        });

        it('does not show progress bar when at maximum level', () => {
            const maxLevelProps = {
                ...defaultProps,
                currentXP: 15000,
                currentLevel: 11,
                xpForNextLevel: 0,
            };

            render(
                <TestWrapper>
                    <XPProgress {...maxLevelProps} />
                </TestWrapper>
            );

            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });
    });

    describe('Recent Transactions', () => {
        it('toggles recent transactions visibility when button is clicked', async () => {
            render(
                <TestWrapper>
                    <XPProgress {...defaultProps} />
                </TestWrapper>
            );

            // Initially should show "Show recent activity" button
            expect(screen.getByLabelText('Show recent activity')).toBeInTheDocument();

            // Click to show transactions
            const toggleButton = screen.getByLabelText('Show recent activity');
            fireEvent.click(toggleButton);

            // Button should change to "Hide recent activity"
            await waitFor(() => {
                expect(screen.getByLabelText('Hide recent activity')).toBeInTheDocument();
            });

            // Transactions should now be visible
            expect(screen.getByText('Completed a quest')).toBeInTheDocument();

            // Click to hide transactions
            const hideButton = screen.getByLabelText('Hide recent activity');
            fireEvent.click(hideButton);

            // Button should change back to "Show recent activity"
            await waitFor(() => {
                expect(screen.getByLabelText('Show recent activity')).toBeInTheDocument();
            });
        });

        it('displays correct action descriptions for different XP actions', async () => {
            render(
                <TestWrapper>
                    <XPProgress {...defaultProps} />
                </TestWrapper>
            );

            // Show transactions
            fireEvent.click(screen.getByLabelText('Show recent activity'));

            await waitFor(() => {
                expect(screen.getByText('Completed a quest')).toBeInTheDocument();
                expect(screen.getByText('Created a new quest')).toBeInTheDocument();
                expect(screen.getByText('Added a new app to track')).toBeInTheDocument();
                expect(screen.getByText('Interacted with a review')).toBeInTheDocument();
                expect(screen.getByText('Login streak bonus (7 days)')).toBeInTheDocument();
            });
        });

        it('displays correct XP amounts for transactions', async () => {
            render(
                <TestWrapper>
                    <XPProgress {...defaultProps} />
                </TestWrapper>
            );

            // Show transactions
            fireEvent.click(screen.getByLabelText('Show recent activity'));

            await waitFor(() => {
                expect(screen.getByText('+15 XP')).toBeInTheDocument();
                expect(screen.getAllByText('+10 XP')).toHaveLength(2); // Two transactions with +10 XP
                expect(screen.getByText('+20 XP')).toBeInTheDocument();
                expect(screen.getByText('+8 XP')).toBeInTheDocument();
            });
        });

        it('formats transaction timestamps correctly', async () => {
            render(
                <TestWrapper>
                    <XPProgress {...defaultProps} />
                </TestWrapper>
            );

            // Show transactions
            fireEvent.click(screen.getByLabelText('Show recent activity'));

            await waitFor(() => {
                // Check for relative time formatting - the exact text may vary based on calculation
                const timeElements = screen.getAllByText(/ago|Yesterday|Jan/);
                expect(timeElements.length).toBeGreaterThan(0);
            });
        });

        it('displays message when no recent transactions exist', async () => {
            const noTransactionsProps = {
                ...defaultProps,
                recentTransactions: [],
            };

            render(
                <TestWrapper>
                    <XPProgress {...noTransactionsProps} />
                </TestWrapper>
            );

            // Show transactions
            fireEvent.click(screen.getByLabelText('Show recent activity'));

            await waitFor(() => {
                expect(screen.getByText('No recent activity')).toBeInTheDocument();
            });
        });

        it('limits displayed transactions to 10 most recent', async () => {
            const manyTransactions: XPTransaction[] = Array.from({ length: 15 }, (_, i) => ({
                amount: 10,
                action: XPAction.QUEST_CREATED,
                timestamp: new Date(`2024-01-${15 - i}T10:00:00Z`),
                metadata: { questId: `quest${i}` }
            }));

            const manyTransactionsProps = {
                ...defaultProps,
                recentTransactions: manyTransactions,
            };

            render(
                <TestWrapper>
                    <XPProgress {...manyTransactionsProps} />
                </TestWrapper>
            );

            // Show transactions
            fireEvent.click(screen.getByLabelText('Show recent activity'));

            await waitFor(() => {
                // Should only show 10 transactions (10 "+10 XP" chips)
                const xpChips = screen.getAllByText('+10 XP');
                expect(xpChips).toHaveLength(10);
            });
        });
    });

    describe('Level Up Animation', () => {
        it('shows level up animation when showLevelUpAnimation is true', async () => {
            const animationProps = {
                ...defaultProps,
                showLevelUpAnimation: true,
            };

            render(
                <TestWrapper>
                    <XPProgress {...animationProps} />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Level Up!')).toBeInTheDocument();
                expect(screen.getByText('You reached Level 3!')).toBeInTheDocument();
            });
        });

        it('calls onAnimationComplete after animation duration', async () => {
            const mockOnAnimationComplete = jest.fn();
            const animationProps = {
                ...defaultProps,
                showLevelUpAnimation: true,
                onAnimationComplete: mockOnAnimationComplete,
            };

            render(
                <TestWrapper>
                    <XPProgress {...animationProps} />
                </TestWrapper>
            );

            // Fast-forward time to trigger animation completion
            jest.advanceTimersByTime(3000);

            await waitFor(() => {
                expect(mockOnAnimationComplete).toHaveBeenCalledTimes(1);
            }, { timeout: 5000 });
        });

        it('does not show animation when showLevelUpAnimation is false', () => {
            render(
                <TestWrapper>
                    <XPProgress {...defaultProps} />
                </TestWrapper>
            );

            // The animation overlay should not be visible (opacity 0 or visibility hidden)
            const levelUpElements = screen.queryAllByText('Level Up!');
            if (levelUpElements.length > 0) {
                // If the element exists, it should be hidden (opacity 0)
                const animationBox = levelUpElements[0].closest('[style*="opacity: 0"]');
                expect(animationBox).toBeInTheDocument();
            }
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels for interactive elements', () => {
            render(
                <TestWrapper>
                    <XPProgress {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByLabelText('Show recent activity')).toBeInTheDocument();
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });

        it('updates ARIA label when transactions are expanded', async () => {
            render(
                <TestWrapper>
                    <XPProgress {...defaultProps} />
                </TestWrapper>
            );

            const toggleButton = screen.getByLabelText('Show recent activity');
            fireEvent.click(toggleButton);

            await waitFor(() => {
                expect(screen.getByLabelText('Hide recent activity')).toBeInTheDocument();
            });
        });
    });

    describe('Edge Cases', () => {
        it('handles zero XP correctly', () => {
            const zeroXPProps = {
                ...defaultProps,
                currentXP: 0,
                currentLevel: 1,
                xpForNextLevel: 100,
            };

            render(
                <TestWrapper>
                    <XPProgress {...zeroXPProps} />
                </TestWrapper>
            );

            expect(screen.getByText('Level 1')).toBeInTheDocument();
            expect(screen.getByText('0 XP')).toBeInTheDocument();
            expect(screen.getByText('100 XP to go')).toBeInTheDocument();
        });

        it('handles large XP numbers with proper formatting', () => {
            const largeXPProps = {
                ...defaultProps,
                currentXP: 1234567,
                currentLevel: 11,
                xpForNextLevel: 0,
            };

            render(
                <TestWrapper>
                    <XPProgress {...largeXPProps} />
                </TestWrapper>
            );

            expect(screen.getByText('1,234,567 XP')).toBeInTheDocument();
        });

        it('handles transactions with missing metadata gracefully', async () => {
            const transactionWithoutMetadata: XPTransaction = {
                amount: 5,
                action: XPAction.LOGIN_STREAK_BONUS,
                timestamp: new Date('2024-01-15T10:00:00Z'),
                // No metadata
            };

            const propsWithoutMetadata = {
                ...defaultProps,
                recentTransactions: [transactionWithoutMetadata],
            };

            render(
                <TestWrapper>
                    <XPProgress {...propsWithoutMetadata} />
                </TestWrapper>
            );

            fireEvent.click(screen.getByLabelText('Show recent activity'));

            await waitFor(() => {
                expect(screen.getByText('Login streak bonus (0 days)')).toBeInTheDocument();
            });
        });
    });
});
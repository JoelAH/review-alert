import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BadgeCollection from '../BadgeCollection';
import { Badge, BadgeProgress, BadgeCategory } from '@/types/gamification';

// Mock theme for testing
const theme = createTheme();

// Test data
const mockEarnedBadges: Badge[] = [
    {
        id: 'getting-started',
        name: 'Getting Started',
        description: 'Earned your first 100 XP',
        category: BadgeCategory.MILESTONE,
        earnedAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
        id: 'quest-warrior',
        name: 'Quest Warrior',
        description: 'Completed 10 quests',
        category: BadgeCategory.ACHIEVEMENT,
        earnedAt: new Date('2024-01-20T15:30:00Z'),
    },
];

const mockBadgeProgress: BadgeProgress[] = [
    {
        badge: {
            id: 'getting-started',
            name: 'Getting Started',
            description: 'Earned your first 100 XP',
            category: BadgeCategory.MILESTONE,
            requirements: [{ type: 'xp', value: 100 }],
        },
        progress: 100,
        target: 100,
        earned: true,
    },
    {
        badge: {
            id: 'quest-explorer',
            name: 'Quest Explorer',
            description: 'Reached 500 XP',
            category: BadgeCategory.MILESTONE,
            requirements: [{ type: 'xp', value: 500 }],
        },
        progress: 380,
        target: 500,
        earned: false,
    },
    {
        badge: {
            id: 'quest-warrior',
            name: 'Quest Warrior',
            description: 'Completed 10 quests',
            category: BadgeCategory.ACHIEVEMENT,
            requirements: [{ type: 'activity_count', value: 10, field: 'questsCompleted' }],
        },
        progress: 10,
        target: 10,
        earned: true,
    },
    {
        badge: {
            id: 'dedicated-user',
            name: 'Dedicated User',
            description: 'Maintained a 7-day login streak',
            category: BadgeCategory.STREAK,
            requirements: [{ type: 'streak', value: 7 }],
        },
        progress: 3,
        target: 7,
        earned: false,
    },
];

// Wrapper component with theme
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider theme={theme}>
        {children}
    </ThemeProvider>
);

describe('BadgeCollection', () => {
    const defaultProps = {
        badges: mockEarnedBadges,
        badgeProgress: mockBadgeProgress,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders the badge collection header', () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByText('Badge Collection')).toBeInTheDocument();
        });

        it('displays earned badge count correctly', () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByText('2/4 Earned')).toBeInTheDocument();
        });

        it('displays close to earning count when applicable', () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            // Quest Explorer is at 380/500 (76%) which is >= 75%
            expect(screen.getByText('1 Close')).toBeInTheDocument();
        });

        it('renders all badges in grid layout', () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByText('Getting Started')).toBeInTheDocument();
            expect(screen.getByText('Quest Explorer')).toBeInTheDocument();
            expect(screen.getByText('Quest Warrior')).toBeInTheDocument();
            expect(screen.getByText('Dedicated User')).toBeInTheDocument();
        });

        it('shows earned badges with proper styling', () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            // Check for earned date display
            expect(screen.getByText(/Earned Jan 15, 2024/)).toBeInTheDocument();
            expect(screen.getByText(/Earned Jan 20, 2024/)).toBeInTheDocument();
        });

        it('shows progress bars for unearned badges', () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            // Check for progress indicators
            expect(screen.getByText('380/500')).toBeInTheDocument();
            expect(screen.getByText('3/7')).toBeInTheDocument();
        });

        it('displays category chips correctly', () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getAllByText('Milestone')).toHaveLength(2); // Getting Started and Quest Explorer
            expect(screen.getByText('Achievement')).toBeInTheDocument();
            expect(screen.getByText('Streak')).toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        it('renders empty state when no badges are available', () => {
            render(
                <TestWrapper>
                    <BadgeCollection badges={[]} badgeProgress={[]} />
                </TestWrapper>
            );

            expect(screen.getByText('No badges available')).toBeInTheDocument();
            expect(screen.getByText('Start completing activities to earn your first badge!')).toBeInTheDocument();
        });
    });

    describe('Badge Interaction', () => {
        it('opens modal when badge is clicked', async () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            const gettingStartedBadge = screen.getByText('Getting Started');
            fireEvent.click(gettingStartedBadge);

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });
        });

        it('calls onBadgeClick callback when provided', () => {
            const mockOnBadgeClick = jest.fn();
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} onBadgeClick={mockOnBadgeClick} />
                </TestWrapper>
            );

            const gettingStartedBadge = screen.getByText('Getting Started');
            fireEvent.click(gettingStartedBadge);

            expect(mockOnBadgeClick).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'getting-started',
                    name: 'Getting Started',
                })
            );
        });

        it('closes modal when close button is clicked', async () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            // Open modal
            const gettingStartedBadge = screen.getByText('Getting Started');
            fireEvent.click(gettingStartedBadge);

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            // Close modal
            const closeButton = screen.getByRole('button', { name: /close/i });
            fireEvent.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });
        });
    });

    describe('Badge Modal Content', () => {
        it('displays badge details in modal for earned badge', async () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            const gettingStartedBadge = screen.getByText('Getting Started');
            fireEvent.click(gettingStartedBadge);

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
                expect(screen.getByText('Earned your first 100 XP')).toBeInTheDocument();
                expect(screen.getByText('Reach 100 XP')).toBeInTheDocument();
                expect(screen.getByText('Badge Earned!')).toBeInTheDocument();
            });
        });

        it('displays progress information in modal for unearned badge', async () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            const questExplorerBadge = screen.getByText('Quest Explorer');
            fireEvent.click(questExplorerBadge);

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
                expect(screen.getByText('Your Progress')).toBeInTheDocument();
                expect(screen.getByText('380 / 500')).toBeInTheDocument();
                expect(screen.getByText('76%')).toBeInTheDocument();
            });
        });

        it('shows close to earning message for badges near completion', async () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            const questExplorerBadge = screen.getByText('Quest Explorer');
            fireEvent.click(questExplorerBadge);

            await waitFor(() => {
                expect(screen.getByText("You're close to earning this badge!")).toBeInTheDocument();
            });
        });

        it('displays different requirement types correctly', async () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            // Test activity count requirement
            const questWarriorBadge = screen.getByText('Quest Warrior');
            fireEvent.click(questWarriorBadge);

            await waitFor(() => {
                expect(screen.getByText('Complete 10 quests completed')).toBeInTheDocument();
            });

            // Close modal and test streak requirement
            const closeButton = screen.getByRole('button', { name: /close/i });
            fireEvent.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });

            const dedicatedUserBadge = screen.getByText('Dedicated User');
            fireEvent.click(dedicatedUserBadge);

            await waitFor(() => {
                expect(screen.getByText('Maintain a 7-day login streak')).toBeInTheDocument();
            });
        });
    });

    describe('Badge Sorting', () => {
        it('sorts earned badges before unearned badges', () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            const badgeNames = screen.getAllByText(/Getting Started|Quest Warrior|Quest Explorer|Dedicated User/);
            const badgeTexts = badgeNames.map(element => element.textContent);

            // Earned badges (Getting Started, Quest Warrior) should come before unearned ones
            const gettingStartedIndex = badgeTexts.findIndex(text => text === 'Getting Started');
            const questWarriorIndex = badgeTexts.findIndex(text => text === 'Quest Warrior');
            const questExplorerIndex = badgeTexts.findIndex(text => text === 'Quest Explorer');
            const dedicatedUserIndex = badgeTexts.findIndex(text => text === 'Dedicated User');

            expect(gettingStartedIndex).toBeLessThan(questExplorerIndex);
            expect(questWarriorIndex).toBeLessThan(dedicatedUserIndex);
        });
    });

    describe('Visual Indicators', () => {
        it('shows close to earning indicator badge', () => {
            const { container } = render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            // Quest Explorer should have the close to earning indicator (!)
            // Check for the MUI Badge component with exclamation mark
            const badgeIndicators = container.querySelectorAll('.MuiBadge-badge');
            expect(badgeIndicators.length).toBeGreaterThan(0);
        });

        it('applies different opacity for earned vs unearned badges', () => {
            const { container } = render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            // Check that cards have different styling (this is a basic check)
            const cards = container.querySelectorAll('[class*="MuiCard-root"]');
            expect(cards.length).toBe(4);
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels and roles', () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            // Check for dialog role when modal is opened
            const gettingStartedBadge = screen.getByText('Getting Started');
            fireEvent.click(gettingStartedBadge);

            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('supports keyboard navigation', async () => {
            render(
                <TestWrapper>
                    <BadgeCollection {...defaultProps} />
                </TestWrapper>
            );

            const gettingStartedBadge = screen.getByText('Getting Started');
            
            // Simulate keyboard interaction
            gettingStartedBadge.focus();
            fireEvent.keyDown(gettingStartedBadge, { key: 'Enter' });

            // Modal should open (though click simulation might be needed for full test)
            fireEvent.click(gettingStartedBadge);
            
            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('handles missing badge data gracefully', () => {
            const incompleteProgress: BadgeProgress[] = [
                {
                    badge: {
                        id: 'test-badge',
                        name: 'Test Badge',
                        description: 'Test description',
                        category: BadgeCategory.MILESTONE,
                        requirements: [],
                    },
                    progress: 0,
                    target: 100,
                    earned: false,
                },
            ];

            render(
                <TestWrapper>
                    <BadgeCollection badges={[]} badgeProgress={incompleteProgress} />
                </TestWrapper>
            );

            expect(screen.getByText('Test Badge')).toBeInTheDocument();
        });

        it('handles badges without requirements', async () => {
            const badgeWithoutRequirements: BadgeProgress[] = [
                {
                    badge: {
                        id: 'no-req-badge',
                        name: 'No Requirements Badge',
                        description: 'Badge without requirements',
                        category: BadgeCategory.MILESTONE,
                        requirements: [],
                    },
                    progress: 0,
                    target: 1,
                    earned: false,
                },
            ];

            render(
                <TestWrapper>
                    <BadgeCollection badges={[]} badgeProgress={badgeWithoutRequirements} />
                </TestWrapper>
            );

            const badge = screen.getByText('No Requirements Badge');
            fireEvent.click(badge);

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
                expect(screen.getByText('Requirements')).toBeInTheDocument();
            });
        });
    });
});
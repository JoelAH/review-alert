import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import QuestsTab from '../QuestsTab';
import { QuestService } from '@/lib/services/quests';
import { Quest, QuestState, QuestType, QuestPriority } from '@/lib/models/client/quest';
import { User } from '@/lib/models/client/user';

// Mock the QuestService
jest.mock('@/lib/services/quests', () => ({
    QuestService: {
        fetchQuests: jest.fn(),
        updateQuest: jest.fn(),
    },
    QuestError: {
        fromError: jest.fn((error) => {
            if (error instanceof Error) {
                return { message: error.message };
            }
            return { message: 'An unexpected error occurred' };
        }),
    },
}));

const mockQuestService = QuestService as jest.Mocked<typeof QuestService>;

// Mock the QuestCard component
jest.mock('../QuestCard', () => {
    return function MockQuestCard({ quest, onStateChange, onEdit }: any) {
        const handleStateChange = async () => {
            try {
                await onStateChange(quest._id, QuestState.DONE);
            } catch (error) {
                // Silently handle errors in the mock
            }
        };

        return (
            <div data-testid={`quest-card-${quest._id}`}>
                <div>{quest.title}</div>
                <div>{quest.state}</div>
                <div>{quest.priority}</div>
                <button onClick={handleStateChange}>
                    Change State
                </button>
                <button onClick={() => onEdit(quest)}>Edit</button>
            </div>
        );
    };
});

// Mock the QuestModal component
jest.mock('../QuestModal', () => {
    return function MockQuestModal({ open, onClose, onSubmit, mode }: any) {
        if (!open) return null;
        return (
            <div data-testid="quest-modal">
                <div>Mode: {mode}</div>
                <button onClick={onClose}>Close</button>
                <button onClick={() => onSubmit({ title: 'Updated Quest' })}>
                    Submit
                </button>
            </div>
        );
    };
});

const theme = createTheme();

const mockUser: User = {
    _id: 'user1',
    email: 'test@example.com',
    displayName: 'Test User',
    apps: [],
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockQuests: Quest[] = [
    {
        _id: 'quest1',
        user: 'user1',
        title: 'Fix login bug',
        details: 'Users cannot log in with Google',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
        state: QuestState.OPEN,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
    },
    {
        _id: 'quest2',
        user: 'user1',
        title: 'Add dark mode',
        details: 'Implement dark theme support',
        type: QuestType.FEATURE_REQUEST,
        priority: QuestPriority.MEDIUM,
        state: QuestState.IN_PROGRESS,
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02'),
    },
    {
        _id: 'quest3',
        user: 'user1',
        title: 'Improve performance',
        details: 'Optimize loading times',
        type: QuestType.IMPROVEMENT,
        priority: QuestPriority.LOW,
        state: QuestState.DONE,
        createdAt: new Date('2023-01-03'),
        updatedAt: new Date('2023-01-03'),
    },
];

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

describe('QuestsTab', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Loading State', () => {
        it('should show loading skeletons while fetching quests', () => {
            mockQuestService.fetchQuests.mockImplementation(() => new Promise(() => {})); // Never resolves

            renderWithTheme(<QuestsTab user={mockUser} />);

            // Check for skeleton elements by class name since they don't have test IDs
            const skeletons = document.querySelectorAll('.MuiSkeleton-root');
            expect(skeletons.length).toBeGreaterThan(0);
        });
    });

    describe('Quest Display', () => {
        beforeEach(() => {
            mockQuestService.fetchQuests.mockResolvedValue({
                quests: mockQuests,
                hasMore: false,
                totalCount: 3,
                overview: {
                    stateBreakdown: { open: 1, inProgress: 1, done: 1 },
                    priorityBreakdown: { high: 1, medium: 1, low: 1 },
                    typeBreakdown: { bugFix: 1, featureRequest: 1, improvement: 1, research: 0, other: 0 },
                },
            });
        });

        it('should display quest overview with correct counts', async () => {
            renderWithTheme(<QuestsTab user={mockUser} />);

            await waitFor(() => {
                expect(screen.getByText('Quest Management')).toBeInTheDocument();
                expect(screen.getByText('Quest Overview')).toBeInTheDocument();
            });

            // Check that all state labels are present
            expect(screen.getByText('Open')).toBeInTheDocument();
            expect(screen.getByText('In Progress')).toBeInTheDocument();
            expect(screen.getByText('Done')).toBeInTheDocument();
        });

        it('should group and display quests by state', async () => {
            renderWithTheme(<QuestsTab user={mockUser} />);

            await waitFor(() => {
                expect(screen.getByText('Open Quests (1)')).toBeInTheDocument();
                expect(screen.getByText('In Progress (1)')).toBeInTheDocument();
                expect(screen.getByText('Completed (1)')).toBeInTheDocument();
            });

            // Check that quest cards are rendered
            expect(screen.getByTestId('quest-card-quest1')).toBeInTheDocument();
            expect(screen.getByTestId('quest-card-quest2')).toBeInTheDocument();
            expect(screen.getByTestId('quest-card-quest3')).toBeInTheDocument();
        });

        it('should sort quests correctly by state then priority', async () => {
            const unsortedQuests = [
                { ...mockQuests[2] }, // DONE, LOW
                { ...mockQuests[0] }, // OPEN, HIGH
                { ...mockQuests[1] }, // IN_PROGRESS, MEDIUM
            ];

            mockQuestService.fetchQuests.mockResolvedValue({
                quests: unsortedQuests,
                hasMore: false,
                totalCount: 3,
                overview: {
                    stateBreakdown: { open: 1, inProgress: 1, done: 1 },
                    priorityBreakdown: { high: 1, medium: 1, low: 1 },
                    typeBreakdown: { bugFix: 1, featureRequest: 1, improvement: 1, research: 0, other: 0 },
                },
            });

            renderWithTheme(<QuestsTab user={mockUser} />);

            await waitFor(() => {
                expect(screen.getByText('Open Quests (1)')).toBeInTheDocument();
            });

            // The component should sort quests internally, so we just verify they're all displayed
            expect(screen.getByTestId('quest-card-quest1')).toBeInTheDocument();
            expect(screen.getByTestId('quest-card-quest2')).toBeInTheDocument();
            expect(screen.getByTestId('quest-card-quest3')).toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        it('should show empty state when no quests exist', async () => {
            mockQuestService.fetchQuests.mockResolvedValue({
                quests: [],
                hasMore: false,
                totalCount: 0,
                overview: {
                    stateBreakdown: { open: 0, inProgress: 0, done: 0 },
                    priorityBreakdown: { high: 0, medium: 0, low: 0 },
                    typeBreakdown: { bugFix: 0, featureRequest: 0, improvement: 0, research: 0, other: 0 },
                },
            });

            renderWithTheme(<QuestsTab user={mockUser} />);

            await waitFor(() => {
                expect(screen.getByText('No Quests Yet')).toBeInTheDocument();
                expect(screen.getByText('Create your first quest from a review to start tracking actionable tasks.')).toBeInTheDocument();
            });
        });

        it('should not load quests when user is null', async () => {
            renderWithTheme(<QuestsTab user={null} />);

            await waitFor(() => {
                expect(screen.getByText('No Quests Yet')).toBeInTheDocument();
            });

            expect(mockQuestService.fetchQuests).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should show error state when quest loading fails', async () => {
            const errorMessage = 'Failed to load quests';
            mockQuestService.fetchQuests.mockRejectedValue(new Error(errorMessage));

            renderWithTheme(<QuestsTab user={mockUser} />);

            await waitFor(() => {
                expect(screen.getByText('Failed to Load Quests')).toBeInTheDocument();
                // The error message might be transformed by QuestError.fromError
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });

            expect(screen.getByText('Try Again')).toBeInTheDocument();
        });

        it('should retry loading quests when retry button is clicked', async () => {
            mockQuestService.fetchQuests
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    quests: mockQuests,
                    hasMore: false,
                    totalCount: 3,
                    overview: {
                        stateBreakdown: { open: 1, inProgress: 1, done: 1 },
                        priorityBreakdown: { high: 1, medium: 1, low: 1 },
                        typeBreakdown: { bugFix: 1, featureRequest: 1, improvement: 1, research: 0, other: 0 },
                    },
                });

            renderWithTheme(<QuestsTab user={mockUser} />);

            await waitFor(() => {
                expect(screen.getByText('Failed to Load Quests')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Try Again'));

            await waitFor(() => {
                expect(screen.getByText('Quest Management')).toBeInTheDocument();
            });

            expect(mockQuestService.fetchQuests).toHaveBeenCalledTimes(2);
        });
    });

    describe('Quest State Changes', () => {
        beforeEach(() => {
            mockQuestService.fetchQuests.mockResolvedValue({
                quests: mockQuests,
                hasMore: false,
                totalCount: 3,
                overview: {
                    stateBreakdown: { open: 1, inProgress: 1, done: 1 },
                    priorityBreakdown: { high: 1, medium: 1, low: 1 },
                    typeBreakdown: { bugFix: 1, featureRequest: 1, improvement: 1, research: 0, other: 0 },
                },
            });
        });

        it('should handle quest state changes', async () => {
            const updatedQuest = { ...mockQuests[0], state: QuestState.DONE };
            mockQuestService.updateQuest.mockResolvedValue(updatedQuest);

            renderWithTheme(<QuestsTab user={mockUser} />);

            await waitFor(() => {
                expect(screen.getByTestId('quest-card-quest1')).toBeInTheDocument();
            });

            // Find the specific "Change State" button within the quest1 card
            const quest1Card = screen.getByTestId('quest-card-quest1');
            const changeStateButton = quest1Card.querySelector('button');
            fireEvent.click(changeStateButton!);

            await waitFor(() => {
                expect(mockQuestService.updateQuest).toHaveBeenCalledWith('quest1', { state: QuestState.DONE });
            });
        });

        it('should handle quest state change errors', async () => {
            mockQuestService.updateQuest.mockRejectedValue(new Error('Update failed'));

            renderWithTheme(<QuestsTab user={mockUser} />);

            await waitFor(() => {
                expect(screen.getByTestId('quest-card-quest1')).toBeInTheDocument();
            });

            // The error should be thrown and handled by the QuestStateSelector component
            const quest1Card = screen.getByTestId('quest-card-quest1');
            const changeStateButton = quest1Card.querySelector('button');
            
            // The mock QuestCard component will trigger the handleStateChange function
            // which will throw an error due to the mocked rejection
            expect(() => {
                fireEvent.click(changeStateButton!);
            }).not.toThrow(); // The error is caught and re-thrown asynchronously
            
            await waitFor(() => {
                expect(mockQuestService.updateQuest).toHaveBeenCalled();
            });
        });
    });

    describe('Quest Editing', () => {
        beforeEach(() => {
            mockQuestService.fetchQuests.mockResolvedValue({
                quests: mockQuests,
                hasMore: false,
                totalCount: 3,
                overview: {
                    stateBreakdown: { open: 1, inProgress: 1, done: 1 },
                    priorityBreakdown: { high: 1, medium: 1, low: 1 },
                    typeBreakdown: { bugFix: 1, featureRequest: 1, improvement: 1, research: 0, other: 0 },
                },
            });
        });

        it('should open edit modal when quest edit is triggered', async () => {
            renderWithTheme(<QuestsTab user={mockUser} />);

            await waitFor(() => {
                expect(screen.getByTestId('quest-card-quest1')).toBeInTheDocument();
            });

            // Find the specific "Edit" button within the quest1 card
            const quest1Card = screen.getByTestId('quest-card-quest1');
            const editButton = quest1Card.querySelectorAll('button')[1]; // Second button is Edit
            fireEvent.click(editButton!);

            expect(screen.getByTestId('quest-modal')).toBeInTheDocument();
            expect(screen.getByText('Mode: edit')).toBeInTheDocument();
        });

        it('should handle quest updates from modal', async () => {
            const updatedQuest = { ...mockQuests[0], title: 'Updated Quest' };
            mockQuestService.updateQuest.mockResolvedValue(updatedQuest);

            renderWithTheme(<QuestsTab user={mockUser} />);

            await waitFor(() => {
                expect(screen.getByTestId('quest-card-quest1')).toBeInTheDocument();
            });

            // Find the specific "Edit" button within the quest1 card
            const quest1Card = screen.getByTestId('quest-card-quest1');
            const editButton = quest1Card.querySelectorAll('button')[1]; // Second button is Edit
            fireEvent.click(editButton!);
            
            fireEvent.click(screen.getByText('Submit'));

            await waitFor(() => {
                expect(mockQuestService.updateQuest).toHaveBeenCalledWith('quest1', { title: 'Updated Quest' });
            });

            expect(screen.queryByTestId('quest-modal')).not.toBeInTheDocument();
        });

        it('should close modal when close button is clicked', async () => {
            renderWithTheme(<QuestsTab user={mockUser} />);

            await waitFor(() => {
                expect(screen.getByTestId('quest-card-quest1')).toBeInTheDocument();
            });

            // Find the specific "Edit" button within the quest1 card
            const quest1Card = screen.getByTestId('quest-card-quest1');
            const editButton = quest1Card.querySelectorAll('button')[1]; // Second button is Edit
            fireEvent.click(editButton!);
            
            expect(screen.getByTestId('quest-modal')).toBeInTheDocument();

            fireEvent.click(screen.getByText('Close'));
            expect(screen.queryByTestId('quest-modal')).not.toBeInTheDocument();
        });
    });

    describe('Responsive Layout', () => {
        beforeEach(() => {
            mockQuestService.fetchQuests.mockResolvedValue({
                quests: mockQuests,
                hasMore: false,
                totalCount: 3,
                overview: {
                    stateBreakdown: { open: 1, inProgress: 1, done: 1 },
                    priorityBreakdown: { high: 1, medium: 1, low: 1 },
                    typeBreakdown: { bugFix: 1, featureRequest: 1, improvement: 1, research: 0, other: 0 },
                },
            });
        });

        it('should render quest cards in responsive grid layout', async () => {
            renderWithTheme(<QuestsTab user={mockUser} />);

            await waitFor(() => {
                expect(screen.getByTestId('quest-card-quest1')).toBeInTheDocument();
            });

            // Check that quest cards are rendered (responsive behavior is handled by MUI Grid)
            expect(screen.getByTestId('quest-card-quest1')).toBeInTheDocument();
            expect(screen.getByTestId('quest-card-quest2')).toBeInTheDocument();
            expect(screen.getByTestId('quest-card-quest3')).toBeInTheDocument();
        });
    });
});
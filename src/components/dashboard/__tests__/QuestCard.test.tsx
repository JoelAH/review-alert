import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import QuestCard from '../QuestCard';
import { Quest, QuestType, QuestPriority, QuestState } from '@/lib/models/client/quest';

// Mock theme for testing
const theme = createTheme();

// Helper function to render component with theme
const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

// Mock quest data
const mockQuest: Quest = {
    _id: 'quest-123',
    user: 'user-456',
    reviewId: 'review-789',
    title: 'Fix login bug',
    details: 'Users are unable to login with Google OAuth',
    type: QuestType.BUG_FIX,
    priority: QuestPriority.HIGH,
    state: QuestState.OPEN,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z')
};

const mockOnStateChange = jest.fn().mockResolvedValue(undefined);
const mockOnEdit = jest.fn();

describe('QuestCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic Rendering', () => {
        it('renders quest title correctly', () => {
            renderWithTheme(
                <QuestCard 
                    quest={mockQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Fix login bug')).toBeInTheDocument();
        });

        it('renders quest details when provided', () => {
            renderWithTheme(
                <QuestCard 
                    quest={mockQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Users are unable to login with Google OAuth')).toBeInTheDocument();
        });

        it('does not render details section when details are not provided', () => {
            const questWithoutDetails = { ...mockQuest, details: undefined };
            renderWithTheme(
                <QuestCard 
                    quest={questWithoutDetails} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.queryByText('Users are unable to login with Google OAuth')).not.toBeInTheDocument();
        });

        it('renders creation date correctly', () => {
            renderWithTheme(
                <QuestCard 
                    quest={mockQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Created: Jan 15, 2024')).toBeInTheDocument();
        });

        it('handles missing creation date gracefully', () => {
            const questWithoutDate = { ...mockQuest, createdAt: undefined };
            renderWithTheme(
                <QuestCard 
                    quest={questWithoutDate} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Created: Unknown')).toBeInTheDocument();
        });
    });

    describe('Priority Display', () => {
        it('displays high priority badge correctly', () => {
            renderWithTheme(
                <QuestCard 
                    quest={mockQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('High Priority')).toBeInTheDocument();
        });

        it('displays medium priority badge correctly', () => {
            const mediumPriorityQuest = { ...mockQuest, priority: QuestPriority.MEDIUM };
            renderWithTheme(
                <QuestCard 
                    quest={mediumPriorityQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Medium Priority')).toBeInTheDocument();
        });

        it('displays low priority badge correctly', () => {
            const lowPriorityQuest = { ...mockQuest, priority: QuestPriority.LOW };
            renderWithTheme(
                <QuestCard 
                    quest={lowPriorityQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Low Priority')).toBeInTheDocument();
        });
    });

    describe('Quest Type Display', () => {
        it('displays bug fix type correctly', () => {
            renderWithTheme(
                <QuestCard 
                    quest={mockQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Bug Fix')).toBeInTheDocument();
        });

        it('displays feature request type correctly', () => {
            const featureQuest = { ...mockQuest, type: QuestType.FEATURE_REQUEST };
            renderWithTheme(
                <QuestCard 
                    quest={featureQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Feature Request')).toBeInTheDocument();
        });

        it('displays improvement type correctly', () => {
            const improvementQuest = { ...mockQuest, type: QuestType.IMPROVEMENT };
            renderWithTheme(
                <QuestCard 
                    quest={improvementQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Improvement')).toBeInTheDocument();
        });

        it('displays research type correctly', () => {
            const researchQuest = { ...mockQuest, type: QuestType.RESEARCH };
            renderWithTheme(
                <QuestCard 
                    quest={researchQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Research')).toBeInTheDocument();
        });

        it('displays other type correctly', () => {
            const otherQuest = { ...mockQuest, type: QuestType.OTHER };
            renderWithTheme(
                <QuestCard 
                    quest={otherQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Other')).toBeInTheDocument();
        });
    });

    describe('Quest State Display', () => {
        it('displays open state correctly in selector', () => {
            renderWithTheme(
                <QuestCard 
                    quest={mockQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Open')).toBeInTheDocument();
        });

        it('displays in progress state correctly in selector', () => {
            const inProgressQuest = { ...mockQuest, state: QuestState.IN_PROGRESS };
            renderWithTheme(
                <QuestCard 
                    quest={inProgressQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('In Progress')).toBeInTheDocument();
        });

        it('displays done state correctly in selector', () => {
            const doneQuest = { ...mockQuest, state: QuestState.DONE };
            renderWithTheme(
                <QuestCard 
                    quest={doneQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Done')).toBeInTheDocument();
        });

        it('includes quest state selector component', () => {
            renderWithTheme(
                <QuestCard 
                    quest={mockQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByRole('combobox', { name: 'Quest state selector' })).toBeInTheDocument();
        });

        it('applies strikethrough styling for completed quests', () => {
            const doneQuest = { ...mockQuest, state: QuestState.DONE };
            renderWithTheme(
                <QuestCard 
                    quest={doneQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            const titleElement = screen.getByText('Fix login bug');
            expect(titleElement).toHaveStyle('text-decoration: line-through');
        });
    });

    describe('Visual State Indicators', () => {
        it('applies correct border styling for open state', () => {
            const { container } = renderWithTheme(
                <QuestCard 
                    quest={mockQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            const card = container.querySelector('.MuiCard-root');
            expect(card).toHaveStyle('border-left-width: 4px');
            expect(card).toHaveStyle('border-left-style: solid');
        });

        it('applies correct border styling for done state', () => {
            const doneQuest = { ...mockQuest, state: QuestState.DONE };
            const { container } = renderWithTheme(
                <QuestCard 
                    quest={doneQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            const card = container.querySelector('.MuiCard-root');
            expect(card).toHaveStyle('border-left-width: 4px');
            expect(card).toHaveStyle('border-left-style: solid');
        });

        it('applies different border colors for different states', () => {
            const openQuest = { ...mockQuest, state: QuestState.OPEN };
            const inProgressQuest = { ...mockQuest, state: QuestState.IN_PROGRESS };
            const doneQuest = { ...mockQuest, state: QuestState.DONE };

            const { container: openContainer } = renderWithTheme(
                <QuestCard 
                    quest={openQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            const { container: inProgressContainer } = renderWithTheme(
                <QuestCard 
                    quest={inProgressQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            const { container: doneContainer } = renderWithTheme(
                <QuestCard 
                    quest={doneQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            const openCard = openContainer.querySelector('.MuiCard-root');
            const inProgressCard = inProgressContainer.querySelector('.MuiCard-root');
            const doneCard = doneContainer.querySelector('.MuiCard-root');

            // Verify that different states have different border colors
            const openBorderColor = window.getComputedStyle(openCard!).borderLeftColor;
            const inProgressBorderColor = window.getComputedStyle(inProgressCard!).borderLeftColor;
            const doneBorderColor = window.getComputedStyle(doneCard!).borderLeftColor;

            expect(openBorderColor).not.toBe(inProgressBorderColor);
            expect(inProgressBorderColor).not.toBe(doneBorderColor);
            expect(openBorderColor).not.toBe(doneBorderColor);
        });
    });

    describe('User Interactions', () => {
        it('calls onEdit when edit button is clicked', () => {
            renderWithTheme(
                <QuestCard 
                    quest={mockQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            const editButton = screen.getByLabelText('Edit quest');
            fireEvent.click(editButton);

            expect(mockOnEdit).toHaveBeenCalledTimes(1);
            expect(mockOnEdit).toHaveBeenCalledWith(mockQuest);
        });

        it('has accessible edit button', () => {
            renderWithTheme(
                <QuestCard 
                    quest={mockQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            const editButton = screen.getByLabelText('Edit quest');
            expect(editButton).toBeInTheDocument();
            expect(editButton).toHaveAttribute('aria-label', 'Edit quest');
        });
    });

    describe('Prop Handling', () => {
        it('handles all required props correctly', () => {
            expect(() => {
                renderWithTheme(
                    <QuestCard 
                        quest={mockQuest} 
                        onStateChange={mockOnStateChange} 
                        onEdit={mockOnEdit} 
                    />
                );
            }).not.toThrow();
        });

        it('handles quest with minimal data', () => {
            const minimalQuest: Quest = {
                _id: 'quest-minimal',
                user: 'user-123',
                title: 'Minimal Quest',
                type: QuestType.OTHER,
                priority: QuestPriority.LOW,
                state: QuestState.OPEN
            };

            renderWithTheme(
                <QuestCard 
                    quest={minimalQuest} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Minimal Quest')).toBeInTheDocument();
            expect(screen.getByText('Other')).toBeInTheDocument();
            expect(screen.getByText('Low Priority')).toBeInTheDocument();
            expect(screen.getByText('Open')).toBeInTheDocument();
        });

        it('handles string date format correctly', () => {
            const questWithStringDate = { 
                ...mockQuest, 
                createdAt: '2024-01-15T10:30:00Z' 
            };
            renderWithTheme(
                <QuestCard 
                    quest={questWithStringDate} 
                    onStateChange={mockOnStateChange} 
                    onEdit={mockOnEdit} 
                />
            );

            expect(screen.getByText('Created: Jan 15, 2024')).toBeInTheDocument();
        });
    });
});
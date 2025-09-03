import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import QuestModal, { CreateQuestData } from '../QuestModal';
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

// Mock quest data for testing
const mockQuest: Quest = {
    _id: 'quest-123',
    user: 'user-123',
    reviewId: 'review-123',
    title: 'Fix login bug',
    details: 'Users cannot log in with Google OAuth',
    type: QuestType.BUG_FIX,
    priority: QuestPriority.HIGH,
    state: QuestState.OPEN,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
};

const mockInitialData: Partial<CreateQuestData> = {
    title: 'Suggested quest title',
    details: 'Pre-populated details from review',
    type: QuestType.FEATURE_REQUEST,
    priority: QuestPriority.MEDIUM,
    reviewId: 'review-456',
};

describe('QuestModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders create mode modal with correct title', () => {
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            expect(screen.getByText('Create New Quest')).toBeInTheDocument();
        });

        it('renders edit mode modal with correct title', () => {
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="edit"
                    quest={mockQuest}
                />
            );

            expect(screen.getByText('Edit Quest')).toBeInTheDocument();
        });

        it('renders all form fields', () => {
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            expect(screen.getByLabelText(/quest title/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/quest details/i)).toBeInTheDocument();
            expect(screen.getAllByText('Quest Type')[0]).toBeInTheDocument();
            expect(screen.getAllByText('Priority')[0]).toBeInTheDocument();
        });

        it('renders action buttons', () => {
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /create quest/i })).toBeInTheDocument();
        });

        it('does not render when closed', () => {
            renderWithTheme(
                <QuestModal
                    open={false}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            expect(screen.queryByText('Create New Quest')).not.toBeInTheDocument();
        });
    });

    describe('Form Pre-population', () => {
        it('pre-populates form with initial data in create mode', () => {
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                    initialData={mockInitialData}
                />
            );

            expect(screen.getByDisplayValue('Suggested quest title')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Pre-populated details from review')).toBeInTheDocument();
        });

        it('pre-populates form with quest data in edit mode', () => {
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="edit"
                    quest={mockQuest}
                />
            );

            expect(screen.getByDisplayValue('Fix login bug')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Users cannot log in with Google OAuth')).toBeInTheDocument();
        });

        it('shows review association alert when creating from review', () => {
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                    initialData={mockInitialData}
                />
            );

            expect(screen.getByText(/this quest will be associated with the selected review/i)).toBeInTheDocument();
        });

        it('does not show review association alert in edit mode', () => {
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="edit"
                    quest={mockQuest}
                />
            );

            expect(screen.queryByText(/this quest will be associated with the selected review/i)).not.toBeInTheDocument();
        });
    });

    describe('Form Validation', () => {
        it('disables submit button when title is empty', () => {
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            const submitButton = screen.getByRole('button', { name: /create quest/i });
            expect(submitButton).toBeDisabled();
        });

        it('shows error when title is empty and field loses focus', async () => {
            const user = userEvent.setup();
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            const titleInput = screen.getByLabelText(/quest title/i);
            await user.clear(titleInput);
            await user.tab(); // Trigger validation by moving focus

            await waitFor(() => {
                expect(screen.getByText('Title is required')).toBeInTheDocument();
            });
        });

        it('shows error when title is too short', async () => {
            const user = userEvent.setup();
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            const titleInput = screen.getByLabelText(/quest title/i);
            await user.clear(titleInput);
            await user.type(titleInput, 'ab');
            await user.tab(); // Trigger validation

            await waitFor(() => {
                expect(screen.getByText('Title must be at least 3 characters long')).toBeInTheDocument();
            });
        });

        it('enables submit button when form is valid', async () => {
            const user = userEvent.setup();
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            const titleInput = screen.getByLabelText(/quest title/i);
            await user.clear(titleInput);
            await user.type(titleInput, 'Valid quest title');

            const submitButton = screen.getByRole('button', { name: /create quest/i });
            await waitFor(() => {
                expect(submitButton).toBeEnabled();
            });
        });

        it('clears errors when user starts typing', async () => {
            const user = userEvent.setup();
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            const titleInput = screen.getByLabelText(/quest title/i);

            // Trigger validation error by clearing and blurring
            await user.clear(titleInput);
            await user.tab(); // Trigger validation

            await waitFor(() => {
                expect(screen.getByText('Title is required')).toBeInTheDocument();
            });

            // Start typing to clear error
            await user.click(titleInput);
            await user.type(titleInput, 'N');

            await waitFor(() => {
                expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
            });
        });
    });

    describe('Form Submission', () => {
        it('calls onSubmit with correct data when form is valid', async () => {
            const user = userEvent.setup();
            mockOnSubmit.mockResolvedValue(undefined);

            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            // Fill out form
            const titleInput = screen.getByLabelText(/quest title/i);
            await user.clear(titleInput);
            await user.type(titleInput, 'Test quest title');

            const detailsInput = screen.getByLabelText(/quest details/i);
            await user.clear(detailsInput);
            await user.type(detailsInput, 'Test quest details');

            // Submit form
            const submitButton = screen.getByRole('button', { name: /create quest/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith({
                    title: 'Test quest title',
                    details: 'Test quest details',
                    type: QuestType.OTHER, // Default value
                    priority: QuestPriority.MEDIUM, // Default value
                    reviewId: undefined,
                });
            });
        });

        it('shows loading state during submission', async () => {
            const user = userEvent.setup();
            let resolveSubmit: () => void;
            const submitPromise = new Promise<void>((resolve) => {
                resolveSubmit = resolve;
            });
            mockOnSubmit.mockReturnValue(submitPromise);

            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            // Fill out form
            const titleInput = screen.getByLabelText(/quest title/i);
            await user.type(titleInput, 'Test quest title');

            // Submit form
            const submitButton = screen.getByRole('button', { name: /create quest/i });
            await user.click(submitButton);

            // Check loading state
            expect(screen.getByRole('button', { name: /creating.../i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

            // Resolve submission
            resolveSubmit!();
            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });
        });

        it('handles submission errors gracefully', async () => {
            const user = userEvent.setup();
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            mockOnSubmit.mockRejectedValue(new Error('Submission failed'));

            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            // Fill out form
            const titleInput = screen.getByLabelText(/quest title/i);
            await user.type(titleInput, 'Test quest title');

            // Submit form
            const submitButton = screen.getByRole('button', { name: /create quest/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith('Error submitting quest:', expect.any(Error));
            });

            // Modal should remain open on error
            expect(screen.getByText('Create New Quest')).toBeInTheDocument();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Modal Interactions', () => {
        it('calls onClose when cancel button is clicked', async () => {
            const user = userEvent.setup();
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            await user.click(cancelButton);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('resets form data when modal closes and reopens', () => {
            const { rerender } = renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                    initialData={mockInitialData}
                />
            );

            // Verify initial data is populated
            expect(screen.getByDisplayValue('Suggested quest title')).toBeInTheDocument();

            // Close modal
            rerender(
                <ThemeProvider theme={theme}>
                    <QuestModal
                        open={false}
                        onClose={mockOnClose}
                        onSubmit={mockOnSubmit}
                        mode="create"
                        initialData={mockInitialData}
                    />
                </ThemeProvider>
            );

            // Reopen modal without initial data
            rerender(
                <ThemeProvider theme={theme}>
                    <QuestModal
                        open={true}
                        onClose={mockOnClose}
                        onSubmit={mockOnSubmit}
                        mode="create"
                    />
                </ThemeProvider>
            );

            // Form should be reset - check title field specifically
            const titleInput = screen.getByLabelText(/quest title/i) as HTMLInputElement;
            expect(titleInput.value).toBe('');
        });

        it('prevents closing during submission', async () => {
            const user = userEvent.setup();
            let resolveSubmit: () => void;
            const submitPromise = new Promise<void>((resolve) => {
                resolveSubmit = resolve;
            });
            mockOnSubmit.mockReturnValue(submitPromise);

            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            // Fill out and submit form
            const titleInput = screen.getByLabelText(/quest title/i);
            await user.type(titleInput, 'Test quest title');

            const submitButton = screen.getByRole('button', { name: /create quest/i });
            await user.click(submitButton);

            // Try to cancel during submission
            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            expect(cancelButton).toBeDisabled();

            // Resolve submission
            resolveSubmit!();
            await waitFor(() => {
                expect(mockOnClose).toHaveBeenCalled();
            });
        });
    });

    describe('Dropdown Selections', () => {
        it('allows selecting quest type', async () => {
            const user = userEvent.setup();
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            // Fill out required title first
            const titleInput = screen.getByLabelText(/quest title/i);
            await user.type(titleInput, 'Test quest title');

            // Open quest type dropdown by clicking on the select component
            const typeSelect = screen.getByRole('combobox', { name: /quest type/i });
            await user.click(typeSelect);

            // Select bug fix option
            const bugFixOption = screen.getByText('Bug Fix');
            await user.click(bugFixOption);

            // Submit form
            const submitButton = screen.getByRole('button', { name: /create quest/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: QuestType.BUG_FIX,
                    })
                );
            });
        });

        it('allows selecting priority', async () => {
            const user = userEvent.setup();
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="create"
                />
            );

            // Fill out required title first
            const titleInput = screen.getByLabelText(/quest title/i);
            await user.type(titleInput, 'Test quest title');

            // Open priority dropdown by clicking on the select component
            const prioritySelect = screen.getByRole('combobox', { name: /priority/i });
            await user.click(prioritySelect);

            // Select high priority option
            const highPriorityOption = screen.getByText('High Priority');
            await user.click(highPriorityOption);

            // Submit form
            const submitButton = screen.getByRole('button', { name: /create quest/i });
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalledWith(
                    expect.objectContaining({
                        priority: QuestPriority.HIGH,
                    })
                );
            });
        });
    });

    describe('Edit Mode Specific Tests', () => {
        it('shows correct button text in edit mode', () => {
            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="edit"
                    quest={mockQuest}
                />
            );

            expect(screen.getByRole('button', { name: /update quest/i })).toBeInTheDocument();
        });

        it('shows loading text for edit mode during submission', async () => {
            const user = userEvent.setup();
            let resolveSubmit: () => void;
            const submitPromise = new Promise<void>((resolve) => {
                resolveSubmit = resolve;
            });
            mockOnSubmit.mockReturnValue(submitPromise);

            renderWithTheme(
                <QuestModal
                    open={true}
                    onClose={mockOnClose}
                    onSubmit={mockOnSubmit}
                    mode="edit"
                    quest={mockQuest}
                />
            );

            const submitButton = screen.getByRole('button', { name: /update quest/i });
            await user.click(submitButton);

            expect(screen.getByRole('button', { name: /updating.../i })).toBeInTheDocument();

            resolveSubmit!();
        });
    });
});
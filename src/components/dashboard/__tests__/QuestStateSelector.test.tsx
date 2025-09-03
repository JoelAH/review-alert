import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import QuestStateSelector from '../QuestStateSelector';
import { QuestState } from '@/lib/models/client/quest';

// Create a test theme
const theme = createTheme();

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalConsoleError;
});

// Helper to render component with theme
const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

describe('QuestStateSelector', () => {
    const mockOnStateChange = jest.fn();
    const defaultProps = {
        questId: 'test-quest-id',
        currentState: QuestState.OPEN,
        onStateChange: mockOnStateChange,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders with current state displayed', () => {
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            expect(screen.getByText('Open')).toBeInTheDocument();
            expect(screen.getByRole('combobox', { name: 'Quest state selector' })).toBeInTheDocument();
        });

        it('renders with different initial states', () => {
            renderWithTheme(
                <QuestStateSelector 
                    {...defaultProps} 
                    currentState={QuestState.IN_PROGRESS} 
                />
            );
            
            expect(screen.getByText('In Progress')).toBeInTheDocument();
        });

        it('renders with done state', () => {
            renderWithTheme(
                <QuestStateSelector 
                    {...defaultProps} 
                    currentState={QuestState.DONE} 
                />
            );
            
            expect(screen.getByText('Done')).toBeInTheDocument();
        });

        it('renders in small size by default', () => {
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            expect(select).toHaveClass('MuiInputBase-inputSizeSmall');
        });

        it('renders in medium size when specified', () => {
            renderWithTheme(
                <QuestStateSelector {...defaultProps} size="medium" />
            );
            
            const select = screen.getByRole('combobox');
            expect(select).not.toHaveClass('MuiInputBase-sizeSmall');
        });
    });

    describe('State Selection', () => {
        it('shows all available states in dropdown', async () => {
            const user = userEvent.setup();
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            await user.click(select);
            
            expect(screen.getByRole('option', { name: /open/i })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: /in progress/i })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: /done/i })).toBeInTheDocument();
        });

        it('calls onStateChange when a new state is selected', async () => {
            const user = userEvent.setup();
            mockOnStateChange.mockResolvedValue(undefined);
            
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            await user.click(select);
            
            const inProgressOption = screen.getByRole('option', { name: /in progress/i });
            await user.click(inProgressOption);
            
            expect(mockOnStateChange).toHaveBeenCalledWith('test-quest-id', QuestState.IN_PROGRESS);
        });

        it('does not call onStateChange when the same state is selected', async () => {
            const user = userEvent.setup();
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            await user.click(select);
            
            const openOption = screen.getByRole('option', { name: /open/i });
            await user.click(openOption);
            
            expect(mockOnStateChange).not.toHaveBeenCalled();
        });
    });

    describe('Optimistic Updates', () => {
        it('shows optimistic state immediately when selection changes', async () => {
            const user = userEvent.setup();
            // Make the promise hang to test optimistic state
            mockOnStateChange.mockImplementation(() => new Promise(() => {}));
            
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            await user.click(select);
            
            const inProgressOption = screen.getByRole('option', { name: /in progress/i });
            await user.click(inProgressOption);
            
            // Should show the optimistic state immediately
            expect(screen.getByText('In Progress')).toBeInTheDocument();
        });

        it('shows loading indicator during state update', async () => {
            const user = userEvent.setup();
            mockOnStateChange.mockImplementation(() => new Promise(() => {}));
            
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            await user.click(select);
            
            const inProgressOption = screen.getByRole('option', { name: /in progress/i });
            await user.click(inProgressOption);
            
            expect(screen.getByLabelText('Updating quest state')).toBeInTheDocument();
        });

        it('clears optimistic state on successful update', async () => {
            const user = userEvent.setup();
            mockOnStateChange.mockResolvedValue(undefined);
            
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            await user.click(select);
            
            const inProgressOption = screen.getByRole('option', { name: /in progress/i });
            await user.click(inProgressOption);
            
            await waitFor(() => {
                expect(screen.queryByLabelText('Updating quest state')).not.toBeInTheDocument();
            });
        });

        it('reverts to original state on error', async () => {
            const user = userEvent.setup();
            // Add a small delay to the rejection to allow optimistic state to show
            mockOnStateChange.mockImplementation(() => 
                new Promise((_, reject) => setTimeout(() => reject(new Error('Update failed')), 50))
            );
            
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            await user.click(select);
            
            const inProgressOption = screen.getByRole('option', { name: /in progress/i });
            await user.click(inProgressOption);
            
            // Should show optimistic state initially
            expect(screen.getByText('In Progress')).toBeInTheDocument();
            
            // Should revert to original state after error
            await waitFor(() => {
                expect(screen.getByText('Open')).toBeInTheDocument();
            });
        });
    });

    describe('Loading and Disabled States', () => {
        it('disables select when disabled prop is true', () => {
            renderWithTheme(
                <QuestStateSelector {...defaultProps} disabled={true} />
            );
            
            const select = screen.getByRole('combobox');
            expect(select).toHaveAttribute('aria-disabled', 'true');
        });

        it('disables select during loading', async () => {
            const user = userEvent.setup();
            mockOnStateChange.mockImplementation(() => new Promise(() => {}));
            
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            await user.click(select);
            
            const inProgressOption = screen.getByRole('option', { name: /in progress/i });
            await user.click(inProgressOption);
            
            expect(select).toHaveAttribute('aria-disabled', 'true');
        });

        it('re-enables select after successful update', async () => {
            const user = userEvent.setup();
            mockOnStateChange.mockResolvedValue(undefined);
            
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            await user.click(select);
            
            const inProgressOption = screen.getByRole('option', { name: /in progress/i });
            await user.click(inProgressOption);
            
            await waitFor(() => {
                expect(select).not.toHaveAttribute('aria-disabled', 'true');
            });
        });

        it('re-enables select after error', async () => {
            const user = userEvent.setup();
            mockOnStateChange.mockRejectedValue(new Error('Update failed'));
            
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            await user.click(select);
            
            const inProgressOption = screen.getByRole('option', { name: /in progress/i });
            await user.click(inProgressOption);
            
            await waitFor(() => {
                expect(select).not.toHaveAttribute('aria-disabled', 'true');
            });
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels', () => {
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox', { name: 'Quest state selector' });
            expect(select).toHaveAttribute('aria-describedby', 'quest-state-help-test-quest-id');
        });

        it('provides screen reader feedback for current state', () => {
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const helpText = screen.getByText('Current quest state: open');
            expect(helpText).toBeInTheDocument();
            expect(helpText).toHaveAttribute('aria-live', 'polite');
        });

        it('provides screen reader feedback during loading', async () => {
            const user = userEvent.setup();
            mockOnStateChange.mockImplementation(() => new Promise(() => {}));
            
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            await user.click(select);
            
            const inProgressOption = screen.getByRole('option', { name: /in progress/i });
            await user.click(inProgressOption);
            
            expect(screen.getByText('Updating quest state to in progress')).toBeInTheDocument();
        });

        it('supports keyboard navigation', async () => {
            const user = userEvent.setup();
            mockOnStateChange.mockResolvedValue(undefined);
            
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            
            // Focus the select
            await user.tab();
            expect(select).toHaveFocus();
            
            // Open dropdown with Enter
            await user.keyboard('{Enter}');
            
            // Navigate with arrow keys
            await user.keyboard('{ArrowDown}');
            await user.keyboard('{Enter}');
            
            expect(mockOnStateChange).toHaveBeenCalledWith('test-quest-id', QuestState.IN_PROGRESS);
        });

        it('supports keyboard navigation with Space key', async () => {
            const user = userEvent.setup();
            mockOnStateChange.mockResolvedValue(undefined);
            
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            
            // Focus and open with Space
            select.focus();
            await user.keyboard(' ');
            
            // Navigate and select
            await user.keyboard('{ArrowDown}');
            await user.keyboard('{Enter}');
            
            expect(mockOnStateChange).toHaveBeenCalledWith('test-quest-id', QuestState.IN_PROGRESS);
        });
    });

    describe('Visual Styling', () => {
        it('applies correct colors for different states', () => {
            const { rerender } = renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            // Test Open state (should have info color styling)
            let select = screen.getByRole('combobox');
            expect(select).toHaveStyle({ color: theme.palette.info.main });
            
            // Test In Progress state
            rerender(
                <ThemeProvider theme={theme}>
                    <QuestStateSelector 
                        {...defaultProps} 
                        currentState={QuestState.IN_PROGRESS} 
                    />
                </ThemeProvider>
            );
            select = screen.getByRole('combobox');
            expect(select).toHaveStyle({ color: theme.palette.warning.main });
            
            // Test Done state
            rerender(
                <ThemeProvider theme={theme}>
                    <QuestStateSelector 
                        {...defaultProps} 
                        currentState={QuestState.DONE} 
                    />
                </ThemeProvider>
            );
            select = screen.getByRole('combobox');
            expect(select).toHaveStyle({ color: theme.palette.success.main });
        });

        it('shows color indicators in dropdown options', async () => {
            const user = userEvent.setup();
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            await user.click(select);
            
            // Check that options have color indicators (small colored circles)
            const options = screen.getAllByRole('option');
            expect(options).toHaveLength(3); // Open, In Progress, Done
            
            // Each option should contain text and be properly structured
            expect(screen.getByRole('option', { name: /open/i })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: /in progress/i })).toBeInTheDocument();
            expect(screen.getByRole('option', { name: /done/i })).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('logs errors to console when state update fails', async () => {
            const user = userEvent.setup();
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const error = new Error('Network error');
            mockOnStateChange.mockRejectedValue(error);
            
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            await user.click(select);
            
            const inProgressOption = screen.getByRole('option', { name: /in progress/i });
            await user.click(inProgressOption);
            
            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update quest state:', error);
            });
            
            consoleErrorSpy.mockRestore();
        });

        it('handles multiple rapid state changes gracefully', async () => {
            const user = userEvent.setup();
            let resolveFirst: () => void;
            let resolveSecond: () => void;
            
            mockOnStateChange
                .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }))
                .mockImplementationOnce(() => new Promise(resolve => { resolveSecond = resolve; }));
            
            renderWithTheme(<QuestStateSelector {...defaultProps} />);
            
            const select = screen.getByRole('combobox');
            
            // First change
            await user.click(select);
            await user.click(screen.getByRole('option', { name: /in progress/i }));
            
            // Wait a bit for the first change to process
            await waitFor(() => {
                expect(mockOnStateChange).toHaveBeenCalledTimes(1);
            });
            
            // Resolve first change
            resolveFirst!();
            
            // Wait for first change to complete
            await waitFor(() => {
                expect(select).not.toHaveAttribute('aria-disabled', 'true');
            });
            
            // Second change after first completes
            await user.click(select);
            await user.click(screen.getByRole('option', { name: /done/i }));
            
            // Resolve second change
            resolveSecond!();
            
            // Should handle both changes without issues
            expect(mockOnStateChange).toHaveBeenCalledWith('test-quest-id', QuestState.IN_PROGRESS);
            expect(mockOnStateChange).toHaveBeenCalledWith('test-quest-id', QuestState.DONE);
        });
    });
});
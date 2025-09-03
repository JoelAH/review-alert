import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import QuestStateSelector from '../QuestStateSelector';
import { QuestState } from '@/lib/models/client/quest';

const theme = createTheme();

const renderQuestStateSelector = (props = {}) => {
  const defaultProps = {
    questId: 'quest-1',
    currentState: QuestState.OPEN,
    onStateChange: jest.fn(),
    ...props,
  };

  return render(
    <ThemeProvider theme={theme}>
      <QuestStateSelector {...defaultProps} />
    </ThemeProvider>
  );
};

describe('QuestStateSelector Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading States', () => {
    it('should show loading indicator during state change', async () => {
      const mockOnStateChange = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves

      renderQuestStateSelector({ onStateChange: mockOnStateChange });

      const selector = screen.getByRole('combobox');
      fireEvent.mouseDown(selector);

      const inProgressOption = screen.getByText('In Progress');
      fireEvent.click(inProgressOption);

      await waitFor(() => {
        expect(screen.getByLabelText('Updating quest state')).toBeInTheDocument();
      });
    });

    it('should disable selector during loading', async () => {
      const mockOnStateChange = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves

      renderQuestStateSelector({ onStateChange: mockOnStateChange });

      const selector = screen.getByRole('combobox');
      fireEvent.mouseDown(selector);

      const inProgressOption = screen.getByText('In Progress');
      fireEvent.click(inProgressOption);

      await waitFor(() => {
        expect(selector).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error indicator when state change fails', async () => {
      const mockOnStateChange = jest.fn().mockRejectedValueOnce(new Error('Update failed'));

      renderQuestStateSelector({ onStateChange: mockOnStateChange });

      const selector = screen.getByRole('combobox');
      fireEvent.mouseDown(selector);

      const inProgressOption = screen.getByText('In Progress');
      fireEvent.click(inProgressOption);

      await waitFor(() => {
        expect(screen.getByTitle('Failed to update state. Click to retry.')).toBeInTheDocument();
      });
    });

    it('should revert to original state on error', async () => {
      const mockOnStateChange = jest.fn().mockRejectedValueOnce(new Error('Update failed'));

      renderQuestStateSelector({ 
        currentState: QuestState.OPEN,
        onStateChange: mockOnStateChange 
      });

      const selector = screen.getByRole('combobox');
      
      // Initially should show "Open"
      expect(screen.getByDisplayValue('Open')).toBeInTheDocument();

      fireEvent.mouseDown(selector);
      const inProgressOption = screen.getByText('In Progress');
      fireEvent.click(inProgressOption);

      // Should revert back to "Open" after error
      await waitFor(() => {
        expect(screen.getByDisplayValue('Open')).toBeInTheDocument();
      });
    });

    it('should auto-retry on failure up to 2 times', async () => {
      jest.useFakeTimers();
      
      const mockOnStateChange = jest.fn()
        .mockRejectedValueOnce(new Error('Update failed'))
        .mockRejectedValueOnce(new Error('Update failed'))
        .mockResolvedValueOnce(undefined);

      renderQuestStateSelector({ onStateChange: mockOnStateChange });

      const selector = screen.getByRole('combobox');
      fireEvent.mouseDown(selector);

      const inProgressOption = screen.getByText('In Progress');
      fireEvent.click(inProgressOption);

      // Fast-forward through retry delays
      jest.advanceTimersByTime(1000); // First retry after 1 second
      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalledTimes(2);
      });

      jest.advanceTimersByTime(2000); // Second retry after 2 seconds
      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalledTimes(3);
      });

      jest.useRealTimers();
    });

    it('should not retry more than 2 times', async () => {
      jest.useFakeTimers();
      
      const mockOnStateChange = jest.fn().mockRejectedValue(new Error('Update failed'));

      renderQuestStateSelector({ onStateChange: mockOnStateChange });

      const selector = screen.getByRole('combobox');
      fireEvent.mouseDown(selector);

      const inProgressOption = screen.getByText('In Progress');
      fireEvent.click(inProgressOption);

      // Fast-forward through all possible retry delays
      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalledTimes(3); // Initial + 2 retries
      });

      jest.useRealTimers();
    });
  });

  describe('Optimistic Updates', () => {
    it('should show optimistic state immediately', async () => {
      const mockOnStateChange = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves

      renderQuestStateSelector({ 
        currentState: QuestState.OPEN,
        onStateChange: mockOnStateChange 
      });

      const selector = screen.getByRole('combobox');
      
      // Initially should show "Open"
      expect(screen.getByDisplayValue('Open')).toBeInTheDocument();

      fireEvent.mouseDown(selector);
      const inProgressOption = screen.getByText('In Progress');
      fireEvent.click(inProgressOption);

      // Should immediately show "In Progress" (optimistic update)
      await waitFor(() => {
        expect(screen.getByDisplayValue('In Progress')).toBeInTheDocument();
      });
    });

    it('should clear optimistic state on success', async () => {
      const mockOnStateChange = jest.fn().mockResolvedValueOnce(undefined);

      renderQuestStateSelector({ 
        currentState: QuestState.OPEN,
        onStateChange: mockOnStateChange 
      });

      const selector = screen.getByRole('combobox');
      fireEvent.mouseDown(selector);

      const inProgressOption = screen.getByText('In Progress');
      fireEvent.click(inProgressOption);

      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalledWith('quest-1', QuestState.IN_PROGRESS);
      });

      // Should not show loading indicator after success
      expect(screen.queryByLabelText('Updating quest state')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should announce state changes to screen readers', async () => {
      const mockOnStateChange = jest.fn().mockResolvedValueOnce(undefined);

      renderQuestStateSelector({ 
        currentState: QuestState.OPEN,
        onStateChange: mockOnStateChange 
      });

      const liveRegion = screen.getByText('Current quest state: open');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce loading state to screen readers', async () => {
      const mockOnStateChange = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves

      renderQuestStateSelector({ 
        currentState: QuestState.OPEN,
        onStateChange: mockOnStateChange 
      });

      const selector = screen.getByRole('combobox');
      fireEvent.mouseDown(selector);

      const inProgressOption = screen.getByText('In Progress');
      fireEvent.click(inProgressOption);

      await waitFor(() => {
        expect(screen.getByText('Updating quest state to in progress')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels', () => {
      renderQuestStateSelector();

      const selector = screen.getByRole('combobox');
      expect(selector).toHaveAttribute('aria-label', 'Quest state selector');
      expect(selector).toHaveAttribute('aria-describedby', 'quest-state-help-quest-1');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      renderQuestStateSelector({ disabled: true });

      const selector = screen.getByRole('combobox');
      expect(selector).toBeDisabled();
    });

    it('should not trigger state change when disabled', () => {
      const mockOnStateChange = jest.fn();

      renderQuestStateSelector({ 
        disabled: true,
        onStateChange: mockOnStateChange 
      });

      const selector = screen.getByRole('combobox');
      
      // Try to interact with disabled selector
      fireEvent.mouseDown(selector);
      
      expect(mockOnStateChange).not.toHaveBeenCalled();
    });
  });

  describe('State Validation', () => {
    it('should not trigger change if same state is selected', () => {
      const mockOnStateChange = jest.fn();

      renderQuestStateSelector({ 
        currentState: QuestState.OPEN,
        onStateChange: mockOnStateChange 
      });

      const selector = screen.getByRole('combobox');
      fireEvent.mouseDown(selector);

      const openOption = screen.getByText('Open');
      fireEvent.click(openOption);

      expect(mockOnStateChange).not.toHaveBeenCalled();
    });

    it('should handle all quest states correctly', () => {
      const states = [
        { state: QuestState.OPEN, label: 'Open' },
        { state: QuestState.IN_PROGRESS, label: 'In Progress' },
        { state: QuestState.DONE, label: 'Done' },
      ];

      states.forEach(({ state, label }) => {
        const { unmount } = renderQuestStateSelector({ currentState: state });
        
        expect(screen.getByDisplayValue(label)).toBeInTheDocument();
        
        unmount();
      });
    });
  });
});
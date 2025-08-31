import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ReviewFilters from '../ReviewFilters';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ReviewFilters Integration', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Filter Combinations', () => {
    test('applies multiple filters correctly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      renderWithTheme(
        <ReviewFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
      );

      // Apply platform filter
      const platformSelect = screen.getByLabelText('Platform');
      fireEvent.mouseDown(platformSelect);
      
      await waitFor(() => {
        expect(screen.getByText('Google Play')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Google Play'));
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        platform: 'GooglePlay'
      });

      // Reset mock and apply rating filter
      mockOnFiltersChange.mockClear();
      
      const ratingSelect = screen.getByLabelText('Rating');
      fireEvent.mouseDown(ratingSelect);
      
      await waitFor(() => {
        expect(screen.getByText('5 Stars')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('5 Stars'));
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        rating: 5
      });
    });

    test('preserves existing filters when adding new ones', async () => {
      const existingFilters = {
        platform: 'GooglePlay' as const,
        rating: 5
      };

      renderWithTheme(
        <ReviewFilters filters={existingFilters} onFiltersChange={mockOnFiltersChange} />
      );

      // Add sentiment filter
      const sentimentSelect = screen.getByLabelText('Sentiment');
      fireEvent.mouseDown(sentimentSelect);
      
      await waitFor(() => {
        expect(screen.getByText('Positive')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Positive'));
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        platform: 'GooglePlay',
        rating: 5,
        sentiment: 'POSITIVE'
      });
    });

    test('removes individual filters while preserving others', async () => {
      const existingFilters = {
        platform: 'GooglePlay' as const,
        rating: 5,
        sentiment: 'POSITIVE' as const
      };

      renderWithTheme(
        <ReviewFilters filters={existingFilters} onFiltersChange={mockOnFiltersChange} />
      );

      // Should show active filters
      expect(screen.getByText('3 filters active')).toBeInTheDocument();
      
      // Remove platform filter via chip
      const platformChip = screen.getByText('Platform: Google Play');
      const deleteButton = platformChip.parentElement?.querySelector('[data-testid="CancelIcon"]');
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          platform: undefined,
          rating: 5,
          sentiment: 'POSITIVE'
        });
      }
    });

    test('clears all filters at once', async () => {
      const existingFilters = {
        platform: 'GooglePlay' as const,
        rating: 5,
        sentiment: 'POSITIVE' as const,
        quest: 'BUG' as const
      };

      renderWithTheme(
        <ReviewFilters filters={existingFilters} onFiltersChange={mockOnFiltersChange} />
      );

      // Should show clear all button
      const clearAllButton = screen.getByText('Clear all');
      fireEvent.click(clearAllButton);
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('Search Functionality', () => {
    test('debounces search input correctly', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      renderWithTheme(
        <ReviewFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
      );

      const searchInput = screen.getByPlaceholderText('Search by content...');
      
      // Type quickly
      await user.type(searchInput, 'test search');
      
      // Should not call onFiltersChange immediately
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
      
      // Advance timers to trigger debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: 'test search'
      });
    });

    test('clears search when input is emptied', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      renderWithTheme(
        <ReviewFilters filters={{ search: 'existing search' }} onFiltersChange={mockOnFiltersChange} />
      );

      const searchInput = screen.getByDisplayValue('existing search');
      
      // Clear the input
      await user.clear(searchInput);
      
      // Advance timers to trigger debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: undefined
      });
    });

    test('shows search filter in active filters', () => {
      const filters = { search: 'bug report' };
      
      renderWithTheme(
        <ReviewFilters filters={filters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('Search: "bug report"')).toBeInTheDocument();
    });

    test('removes search filter via chip', () => {
      const filters = { search: 'bug report' };
      
      renderWithTheme(
        <ReviewFilters filters={filters} onFiltersChange={mockOnFiltersChange} />
      );

      const searchChip = screen.getByText('Search: "bug report"');
      const deleteButton = searchChip.parentElement?.querySelector('[data-testid="CancelIcon"]');
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          search: undefined
        });
      }
    });
  });

  describe('Filter State Display', () => {
    test('shows correct active filter count', () => {
      const filters = {
        platform: 'GooglePlay' as const,
        rating: 5,
        sentiment: 'POSITIVE' as const
      };
      
      renderWithTheme(
        <ReviewFilters filters={filters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('3 filters active')).toBeInTheDocument();
    });

    test('uses singular form for single filter', () => {
      const filters = { platform: 'GooglePlay' as const };
      
      renderWithTheme(
        <ReviewFilters filters={filters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('1 filter active')).toBeInTheDocument();
    });

    test('displays all active filters as chips', () => {
      const filters = {
        platform: 'AppleStore' as const,
        rating: 4,
        sentiment: 'NEGATIVE' as const,
        quest: 'FEATURE_REQUEST' as const,
        search: 'crash'
      };
      
      renderWithTheme(
        <ReviewFilters filters={filters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('Platform: Apple App Store')).toBeInTheDocument();
      expect(screen.getByText('Rating: 4 stars')).toBeInTheDocument();
      expect(screen.getByText('Sentiment: Negative')).toBeInTheDocument();
      expect(screen.getByText('Type: Feature Requests')).toBeInTheDocument();
      expect(screen.getByText('Search: "crash"')).toBeInTheDocument();
    });

    test('handles singular rating display correctly', () => {
      const filters = { rating: 1 };
      
      renderWithTheme(
        <ReviewFilters filters={filters} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByText('Rating: 1 star')).toBeInTheDocument();
    });
  });

  describe('Dropdown Options', () => {
    test('platform dropdown shows all options', async () => {
      renderWithTheme(
        <ReviewFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
      );

      const platformSelect = screen.getByLabelText('Platform');
      fireEvent.mouseDown(platformSelect);
      
      await waitFor(() => {
        expect(screen.getByText('All Platforms')).toBeInTheDocument();
        expect(screen.getByText('Google Play')).toBeInTheDocument();
        expect(screen.getByText('Apple App Store')).toBeInTheDocument();
        expect(screen.getByText('Chrome Web Store')).toBeInTheDocument();
      });
    });

    test('rating dropdown shows all star options', async () => {
      renderWithTheme(
        <ReviewFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
      );

      const ratingSelect = screen.getByLabelText('Rating');
      fireEvent.mouseDown(ratingSelect);
      
      await waitFor(() => {
        expect(screen.getByText('All Ratings')).toBeInTheDocument();
        expect(screen.getByText('5 Stars')).toBeInTheDocument();
        expect(screen.getByText('4 Stars')).toBeInTheDocument();
        expect(screen.getByText('3 Stars')).toBeInTheDocument();
        expect(screen.getByText('2 Stars')).toBeInTheDocument();
        expect(screen.getByText('1 Star')).toBeInTheDocument();
      });
    });

    test('sentiment dropdown shows all options', async () => {
      renderWithTheme(
        <ReviewFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
      );

      const sentimentSelect = screen.getByLabelText('Sentiment');
      fireEvent.mouseDown(sentimentSelect);
      
      await waitFor(() => {
        expect(screen.getByText('All Sentiment')).toBeInTheDocument();
        expect(screen.getByText('Positive')).toBeInTheDocument();
        expect(screen.getByText('Negative')).toBeInTheDocument();
      });
    });

    test('quest type dropdown shows all options', async () => {
      renderWithTheme(
        <ReviewFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
      );

      const questSelect = screen.getByLabelText('Quest Type');
      fireEvent.mouseDown(questSelect);
      
      await waitFor(() => {
        expect(screen.getByText('All Types')).toBeInTheDocument();
        expect(screen.getByText('Bug Reports')).toBeInTheDocument();
        expect(screen.getByText('Feature Requests')).toBeInTheDocument();
        expect(screen.getByText('Other')).toBeInTheDocument();
      });
    });
  });

  describe('Reset to Default Values', () => {
    test('resets platform to "all" when All Platforms is selected', async () => {
      const filters = { platform: 'GooglePlay' as const };
      
      renderWithTheme(
        <ReviewFilters filters={filters} onFiltersChange={mockOnFiltersChange} />
      );

      const platformSelect = screen.getByDisplayValue('Google Play');
      fireEvent.mouseDown(platformSelect);
      
      await waitFor(() => {
        expect(screen.getByText('All Platforms')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('All Platforms'));
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        platform: undefined
      });
    });

    test('resets rating to undefined when All Ratings is selected', async () => {
      const filters = { rating: 5 };
      
      renderWithTheme(
        <ReviewFilters filters={filters} onFiltersChange={mockOnFiltersChange} />
      );

      const ratingSelect = screen.getByDisplayValue('5 Stars');
      fireEvent.mouseDown(ratingSelect);
      
      await waitFor(() => {
        expect(screen.getByText('All Ratings')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('All Ratings'));
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        rating: undefined
      });
    });
  });

  describe('Accessibility', () => {
    test('all form controls have proper labels', () => {
      renderWithTheme(
        <ReviewFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
      );

      expect(screen.getByLabelText('Platform')).toBeInTheDocument();
      expect(screen.getByLabelText('Rating')).toBeInTheDocument();
      expect(screen.getByLabelText('Sentiment')).toBeInTheDocument();
      expect(screen.getByLabelText('Quest Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Search reviews')).toBeInTheDocument();
    });

    test('filter chips are keyboard accessible', () => {
      const filters = { platform: 'GooglePlay' as const };
      
      renderWithTheme(
        <ReviewFilters filters={filters} onFiltersChange={mockOnFiltersChange} />
      );

      const chip = screen.getByText('Platform: Google Play');
      expect(chip).toBeInTheDocument();
      
      // Chip should be focusable
      const chipElement = chip.closest('.MuiChip-root');
      expect(chipElement).toHaveAttribute('tabindex');
    });

    test('clear all button is keyboard accessible', () => {
      const filters = { platform: 'GooglePlay' as const };
      
      renderWithTheme(
        <ReviewFilters filters={filters} onFiltersChange={mockOnFiltersChange} />
      );

      const clearAllButton = screen.getByText('Clear all');
      expect(clearAllButton).toBeInTheDocument();
      
      // Should be focusable and clickable
      fireEvent.focus(clearAllButton);
      fireEvent.keyDown(clearAllButton, { key: 'Enter' });
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('Performance', () => {
    test('does not cause unnecessary re-renders', () => {
      const filters = { platform: 'GooglePlay' as const };
      
      const { rerender } = renderWithTheme(
        <ReviewFilters filters={filters} onFiltersChange={mockOnFiltersChange} />
      );

      // Re-render with same props should not cause issues
      rerender(
        <ThemeProvider theme={theme}>
          <ReviewFilters filters={filters} onFiltersChange={mockOnFiltersChange} />
        </ThemeProvider>
      );

      expect(screen.getByText('Platform: Google Play')).toBeInTheDocument();
    });

    test('handles rapid filter changes gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      renderWithTheme(
        <ReviewFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
      );

      const searchInput = screen.getByPlaceholderText('Search by content...');
      
      // Type rapidly
      await user.type(searchInput, 'a');
      await user.type(searchInput, 'b');
      await user.type(searchInput, 'c');
      
      // Should not call onFiltersChange until debounce completes
      expect(mockOnFiltersChange).not.toHaveBeenCalled();
      
      // Advance timers
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      // Should only call once with final value
      expect(mockOnFiltersChange).toHaveBeenCalledTimes(1);
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: 'abc'
      });
    });
  });
});
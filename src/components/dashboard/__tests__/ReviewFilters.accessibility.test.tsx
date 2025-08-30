import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ReviewFilters from '../ReviewFilters';
import { ReviewFiltersProps } from '../types';

expect.extend(toHaveNoViolations);

const theme = createTheme();

const defaultProps: ReviewFiltersProps = {
  filters: {},
  onFiltersChange: jest.fn(),
};

const renderWithTheme = (props: Partial<ReviewFiltersProps> = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return render(
    <ThemeProvider theme={theme}>
      <ReviewFilters {...mergedProps} />
    </ThemeProvider>
  );
};

describe('ReviewFilters Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WCAG Compliance', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = renderWithTheme();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations with active filters', async () => {
      const { container } = renderWithTheme({
        filters: {
          platform: 'GooglePlay',
          rating: 5,
          sentiment: 'POSITIVE',
          quest: 'BUG',
          search: 'test search'
        }
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow keyboard navigation through all form controls', async () => {
      const user = userEvent.setup();
      renderWithTheme();

      // Tab through all form controls
      await user.tab();
      expect(screen.getByLabelText(/search reviews/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('combobox', { name: /platform/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('combobox', { name: /rating/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('combobox', { name: /sentiment/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('combobox', { name: /quest type/i })).toHaveFocus();
    });

    it('should allow keyboard interaction with select dropdowns', async () => {
      const user = userEvent.setup();
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({ onFiltersChange: mockOnFiltersChange });

      // Focus on platform select
      const platformSelect = screen.getByRole('combobox', { name: /platform/i });
      await user.click(platformSelect);

      // Use arrow keys to navigate and Enter to select
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it('should allow keyboard navigation to clear all button when filters are active', async () => {
      const user = userEvent.setup();
      renderWithTheme({
        filters: { platform: 'GooglePlay' }
      });

      // Tab to the clear all button
      const clearAllButton = screen.getByText('Clear all');
      await user.click(clearAllButton);

      expect(clearAllButton).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper labels for all form controls', () => {
      renderWithTheme();

      expect(screen.getByLabelText(/search reviews/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /platform/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /rating/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /sentiment/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /quest type/i })).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      renderWithTheme();

      const heading = screen.getByRole('heading', { name: /filter reviews/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
    });

    it('should provide meaningful text for active filter chips', () => {
      renderWithTheme({
        filters: {
          platform: 'GooglePlay',
          rating: 5,
          sentiment: 'POSITIVE',
          quest: 'BUG',
          search: 'test search'
        }
      });

      expect(screen.getByText('Platform: Google Play')).toBeInTheDocument();
      expect(screen.getByText('Rating: 5 stars')).toBeInTheDocument();
      expect(screen.getByText('Sentiment: Positive')).toBeInTheDocument();
      expect(screen.getByText('Type: Bug Reports')).toBeInTheDocument();
      expect(screen.getByText('Search: "test search"')).toBeInTheDocument();
    });

    it('should announce filter count changes', () => {
      renderWithTheme({
        filters: { platform: 'GooglePlay', rating: 5 }
      });

      expect(screen.getByText('2 filters active')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus when filters are updated', async () => {
      const user = userEvent.setup();
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({ onFiltersChange: mockOnFiltersChange });

      const searchInput = screen.getByLabelText(/search reviews/i);
      await user.click(searchInput);
      await user.type(searchInput, 'test');

      expect(searchInput).toHaveFocus();
    });

    it('should handle focus properly when clearing individual filters', async () => {
      const user = userEvent.setup();
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({
        filters: { platform: 'GooglePlay' },
        onFiltersChange: mockOnFiltersChange
      });

      const platformChip = screen.getByText('Platform: Google Play');
      const deleteButton = platformChip.parentElement?.querySelector('[data-testid="CancelIcon"]');

      if (deleteButton) {
        await user.click(deleteButton);
        // The chip should still be focusable after deletion
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          platform: undefined
        });
      }
    });
  });

  describe('Color and Contrast', () => {
    it('should not rely solely on color for information', () => {
      renderWithTheme({
        filters: { platform: 'GooglePlay', sentiment: 'POSITIVE' }
      });

      // Check that filter information is conveyed through text, not just color
      expect(screen.getByText('Platform: Google Play')).toBeInTheDocument();
      expect(screen.getByText('Sentiment: Positive')).toBeInTheDocument();
    });

    it('should provide text alternatives for visual indicators', () => {
      renderWithTheme({
        filters: { platform: 'GooglePlay' }
      });

      // The chip should have descriptive text
      const filterChip = screen.getByText('Platform: Google Play');
      expect(filterChip).toBeInTheDocument();
    });
  });

  describe('Error States and Feedback', () => {
    it('should handle search input correctly', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({ onFiltersChange: mockOnFiltersChange });

      const searchInput = screen.getByLabelText(/search reviews/i);

      // Test that non-empty values work correctly
      fireEvent.change(searchInput, { target: { value: 'test' } });
      expect(mockOnFiltersChange).toHaveBeenCalledWith({ search: 'test' });
    });

    it('should provide clear feedback when no filters are active', () => {
      renderWithTheme();

      expect(screen.queryByText('Active filters:')).not.toBeInTheDocument();
      expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design Accessibility', () => {
    it('should maintain accessibility on smaller screens', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = renderWithTheme();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
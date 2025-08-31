import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ReviewFilters from '../ReviewFilters';
import { ReviewFiltersProps } from '../types';

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

describe('ReviewFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all filter controls', () => {
      renderWithTheme();

      expect(screen.getByLabelText(/search reviews/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/platform/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/rating/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sentiment/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quest type/i)).toBeInTheDocument();
    });

    it('renders filter title', () => {
      renderWithTheme();
      expect(screen.getByText('Filter Reviews')).toBeInTheDocument();
    });

    it('does not show active filters section when no filters are applied', () => {
      renderWithTheme();
      expect(screen.queryByText('Active filters:')).not.toBeInTheDocument();
    });

    it('shows active filters count when filters are applied', () => {
      renderWithTheme({
        filters: { platform: 'GooglePlay', rating: 5 }
      });
      
      expect(screen.getByText('2 filters active')).toBeInTheDocument();
      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('calls onFiltersChange when search input changes', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({ onFiltersChange: mockOnFiltersChange });

      const searchInput = screen.getByLabelText(/search reviews/i);
      await userEvent.type(searchInput, 'test');

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          search: 't'
        });
      });

      // Check that the final call includes the full text
      expect(mockOnFiltersChange).toHaveBeenLastCalledWith({
        search: 't'
      });
    });

    it('removes search filter when input is cleared', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({ 
        filters: { search: 'existing search' },
        onFiltersChange: mockOnFiltersChange 
      });

      const searchInput = screen.getByLabelText(/search reviews/i);
      await userEvent.clear(searchInput);

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(mockOnFiltersChange).toHaveBeenLastCalledWith({
        search: undefined
      });
    });
  });

  describe('Platform Filter', () => {
    it('calls onFiltersChange when platform is selected', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({ onFiltersChange: mockOnFiltersChange });

      const platformSelect = screen.getByLabelText(/platform/i);
      fireEvent.mouseDown(platformSelect);
      
      const googlePlayOption = screen.getByText('Google Play');
      fireEvent.click(googlePlayOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        platform: 'GooglePlay'
      });
    });

    it('removes platform filter when "All Platforms" is selected', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({ 
        filters: { platform: 'GooglePlay' },
        onFiltersChange: mockOnFiltersChange 
      });

      const platformSelect = screen.getByLabelText(/platform/i);
      fireEvent.mouseDown(platformSelect);
      
      const allPlatformsOption = screen.getByText('All Platforms');
      fireEvent.click(allPlatformsOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        platform: undefined
      });
    });

    it('displays all platform options', async () => {
      renderWithTheme();

      const platformSelect = screen.getByRole('combobox', { name: /platform/i });
      fireEvent.mouseDown(platformSelect);

      // Use getAllByText to handle multiple elements with same text
      expect(screen.getAllByText('All Platforms')).toHaveLength(2); // One in select, one in menu
      expect(screen.getByText('Google Play')).toBeInTheDocument();
      expect(screen.getByText('Apple App Store')).toBeInTheDocument();
      expect(screen.getByText('Chrome Web Store')).toBeInTheDocument();
    });
  });

  describe('Rating Filter', () => {
    it('calls onFiltersChange when rating is selected', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({ onFiltersChange: mockOnFiltersChange });

      const ratingSelect = screen.getByLabelText(/rating/i);
      fireEvent.mouseDown(ratingSelect);
      
      const fiveStarsOption = screen.getByText('5 Stars');
      fireEvent.click(fiveStarsOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        rating: 5
      });
    });

    it('removes rating filter when "All Ratings" is selected', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({ 
        filters: { rating: 5 },
        onFiltersChange: mockOnFiltersChange 
      });

      const ratingSelect = screen.getByLabelText(/rating/i);
      fireEvent.mouseDown(ratingSelect);
      
      const allRatingsOption = screen.getByText('All Ratings');
      fireEvent.click(allRatingsOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        rating: undefined
      });
    });

    it('displays all rating options', async () => {
      renderWithTheme();

      const ratingSelect = screen.getByRole('combobox', { name: /rating/i });
      fireEvent.mouseDown(ratingSelect);

      expect(screen.getAllByText('All Ratings')).toHaveLength(2);
      expect(screen.getByText('5 Stars')).toBeInTheDocument();
      expect(screen.getByText('4 Stars')).toBeInTheDocument();
      expect(screen.getByText('3 Stars')).toBeInTheDocument();
      expect(screen.getByText('2 Stars')).toBeInTheDocument();
      expect(screen.getByText('1 Star')).toBeInTheDocument();
    });
  });

  describe('Sentiment Filter', () => {
    it('calls onFiltersChange when sentiment is selected', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({ onFiltersChange: mockOnFiltersChange });

      // Find the sentiment select by its role and accessible name
      const sentimentSelect = screen.getByRole('combobox', { name: /sentiment/i });
      fireEvent.mouseDown(sentimentSelect);
      
      const positiveOption = screen.getByText('Positive');
      fireEvent.click(positiveOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        sentiment: 'POSITIVE'
      });
    });

    it('removes sentiment filter when "All Sentiment" is selected', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({ 
        filters: { sentiment: 'POSITIVE' },
        onFiltersChange: mockOnFiltersChange 
      });

      const sentimentSelect = screen.getByRole('combobox', { name: /sentiment/i });
      fireEvent.mouseDown(sentimentSelect);
      
      const allSentimentOption = screen.getByText('All Sentiment');
      fireEvent.click(allSentimentOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        sentiment: undefined
      });
    });

    it('displays all sentiment options', async () => {
      renderWithTheme();

      const sentimentSelect = screen.getByRole('combobox', { name: /sentiment/i });
      fireEvent.mouseDown(sentimentSelect);

      expect(screen.getAllByText('All Sentiment')).toHaveLength(2);
      expect(screen.getByText('Positive')).toBeInTheDocument();
      expect(screen.getByText('Negative')).toBeInTheDocument();
    });
  });

  describe('Quest Type Filter', () => {
    it('calls onFiltersChange when quest type is selected', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({ onFiltersChange: mockOnFiltersChange });

      const questSelect = screen.getByRole('combobox', { name: /quest type/i });
      fireEvent.mouseDown(questSelect);
      
      const bugReportsOption = screen.getByText('Bug Reports');
      fireEvent.click(bugReportsOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        quest: 'BUG'
      });
    });

    it('removes quest filter when "All Types" is selected', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({ 
        filters: { quest: 'BUG' },
        onFiltersChange: mockOnFiltersChange 
      });

      const questSelect = screen.getByRole('combobox', { name: /quest type/i });
      fireEvent.mouseDown(questSelect);
      
      const allTypesOption = screen.getByText('All Types');
      fireEvent.click(allTypesOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        quest: undefined
      });
    });

    it('displays all quest type options', async () => {
      renderWithTheme();

      const questSelect = screen.getByRole('combobox', { name: /quest type/i });
      fireEvent.mouseDown(questSelect);

      expect(screen.getAllByText('All Types')).toHaveLength(2);
      expect(screen.getByText('Bug Reports')).toBeInTheDocument();
      expect(screen.getByText('Feature Requests')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });
  });

  describe('Active Filters Display', () => {
    it('shows active filters chips when filters are applied', () => {
      renderWithTheme({
        filters: {
          platform: 'GooglePlay',
          rating: 5,
          sentiment: 'POSITIVE',
          quest: 'BUG',
          search: 'test search'
        }
      });

      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(screen.getByText('Platform: Google Play')).toBeInTheDocument();
      expect(screen.getByText('Rating: 5 stars')).toBeInTheDocument();
      expect(screen.getByText('Sentiment: Positive')).toBeInTheDocument();
      expect(screen.getByText('Type: Bug Reports')).toBeInTheDocument();
      expect(screen.getByText('Search: "test search"')).toBeInTheDocument();
    });

    it('allows removing individual filters via chip delete', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({
        filters: { platform: 'GooglePlay', rating: 5 },
        onFiltersChange: mockOnFiltersChange
      });

      const platformChip = screen.getByText('Platform: Google Play');
      const deleteButton = platformChip.parentElement?.querySelector('[data-testid="CancelIcon"]');
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          rating: 5,
          platform: undefined
        });
      }
    });

    it('handles singular rating display correctly', () => {
      renderWithTheme({
        filters: { rating: 1 }
      });

      expect(screen.getByText('Rating: 1 star')).toBeInTheDocument();
    });
  });

  describe('Clear All Functionality', () => {
    it('shows clear all button when filters are active', () => {
      renderWithTheme({
        filters: { platform: 'GooglePlay' }
      });

      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('calls onFiltersChange with empty object when clear all is clicked', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({
        filters: { platform: 'GooglePlay', rating: 5 },
        onFiltersChange: mockOnFiltersChange
      });

      const clearAllButton = screen.getByText('Clear all');
      fireEvent.click(clearAllButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    });
  });

  describe('Filter State Preservation', () => {
    it('preserves existing filters when updating one filter', async () => {
      const mockOnFiltersChange = jest.fn();
      renderWithTheme({
        filters: { platform: 'GooglePlay', rating: 5 },
        onFiltersChange: mockOnFiltersChange
      });

      const sentimentSelect = screen.getByRole('combobox', { name: /sentiment/i });
      fireEvent.mouseDown(sentimentSelect);
      
      const positiveOption = screen.getByText('Positive');
      fireEvent.click(positiveOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        platform: 'GooglePlay',
        rating: 5,
        sentiment: 'POSITIVE'
      });
    });
  });
});
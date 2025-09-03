import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import CreateQuestButton from '../CreateQuestButton';
import { Review, ReviewQuest, ReviewSentiment, ReviewPriority } from '@/lib/models/client/review';

// Mock the QuestModal component
jest.mock('../QuestModal', () => {
  return function MockQuestModal({ open, onClose, onSubmit, initialData, mode }: any) {
    if (!open) return null;
    
    const handleSubmit = async () => {
      try {
        await onSubmit(initialData);
      } catch (error) {
        // Error is handled by the parent component
      }
    };
    
    return (
      <div data-testid="quest-modal">
        <div>Quest Modal - {mode} mode</div>
        <div data-testid="initial-title">{initialData?.title}</div>
        <div data-testid="initial-details">{initialData?.details}</div>
        <div data-testid="initial-type">{initialData?.type}</div>
        <div data-testid="initial-priority">{initialData?.priority}</div>
        <button onClick={handleSubmit}>Submit Quest</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const theme = createTheme();

const mockReview: Review = {
  _id: 'review-123',
  user: 'user-123',
  appId: 'app-123',
  name: 'John Doe',
  comment: 'This app has a bug that needs to be fixed urgently',
  date: new Date('2023-01-01'),
  rating: 2,
  sentiment: ReviewSentiment.NEGATIVE,
  quest: ReviewQuest.BUG,
  priority: ReviewPriority.HIGH,
};

const mockReviewWithQuest: Review = {
  ...mockReview,
  questId: 'quest-123',
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('CreateQuestButton', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('renders create quest button when no quest exists', () => {
    renderWithTheme(<CreateQuestButton review={mockReview} />);
    
    const button = screen.getByRole('button', { name: /create quest/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('renders quest created button when quest already exists', () => {
    renderWithTheme(<CreateQuestButton review={mockReviewWithQuest} />);
    
    const button = screen.getByRole('button', { name: /quest created/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('renders disabled button when disabled prop is true', () => {
    renderWithTheme(<CreateQuestButton review={mockReview} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /create quest/i });
    expect(button).toBeDisabled();
  });

  it('opens quest modal when button is clicked', () => {
    renderWithTheme(<CreateQuestButton review={mockReview} />);
    
    const button = screen.getByRole('button', { name: /create quest/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('quest-modal')).toBeInTheDocument();
    expect(screen.getByText('Quest Modal - create mode')).toBeInTheDocument();
  });

  it('pre-populates modal with review data', () => {
    renderWithTheme(<CreateQuestButton review={mockReview} />);
    
    const button = screen.getByRole('button', { name: /create quest/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('initial-title')).toHaveTextContent('Review: This app has a bug that needs to be fixed urgently');
    expect(screen.getByTestId('initial-details')).toHaveTextContent('From review by John Doe:');
    expect(screen.getByTestId('initial-type')).toHaveTextContent('BUG_FIX');
    expect(screen.getByTestId('initial-priority')).toHaveTextContent('HIGH');
  });

  it('handles quest creation successfully', async () => {
    const mockOnQuestCreated = jest.fn();
    
    // Mock successful quest creation (API now handles review update internally)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ quest: { _id: 'new-quest-123' } }),
    } as Response);

    renderWithTheme(
      <CreateQuestButton review={mockReview} onQuestCreated={mockOnQuestCreated} />
    );
    
    const button = screen.getByRole('button', { name: /create quest/i });
    fireEvent.click(button);
    
    const submitButton = screen.getByText('Submit Quest');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Check quest creation API call includes reviewId
    expect(mockFetch).toHaveBeenCalledWith('/api/quests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.stringContaining('"reviewId":"review-123"'),
    });

    expect(mockOnQuestCreated).toHaveBeenCalledWith('new-quest-123');
  });

  it('handles quest creation failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock failed quest creation
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    renderWithTheme(<CreateQuestButton review={mockReview} />);
    
    const button = screen.getByRole('button', { name: /create quest/i });
    fireEvent.click(button);
    
    const submitButton = screen.getByText('Submit Quest');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error creating quest:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('shows loading state during quest creation', async () => {
    // Mock a delayed response
    mockFetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ _id: 'new-quest-123' }),
        } as Response), 100)
      )
    );

    renderWithTheme(<CreateQuestButton review={mockReview} />);
    
    const button = screen.getByRole('button', { name: /create quest/i });
    fireEvent.click(button);
    
    const submitButton = screen.getByText('Submit Quest');
    fireEvent.click(submitButton);
    
    // Check that button shows loading state
    await waitFor(() => {
      const loadingButton = screen.getByRole('button', { name: /create quest/i });
      expect(loadingButton).toBeDisabled();
    });
  });

  it('closes modal when close button is clicked', () => {
    renderWithTheme(<CreateQuestButton review={mockReview} />);
    
    const button = screen.getByRole('button', { name: /create quest/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('quest-modal')).toBeInTheDocument();
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('quest-modal')).not.toBeInTheDocument();
  });

  it('does not open modal when quest already exists', () => {
    renderWithTheme(<CreateQuestButton review={mockReviewWithQuest} />);
    
    const button = screen.getByRole('button', { name: /quest created/i });
    fireEvent.click(button);
    
    expect(screen.queryByTestId('quest-modal')).not.toBeInTheDocument();
  });

  it('maps review quest types correctly', () => {
    const featureRequestReview: Review = {
      ...mockReview,
      quest: ReviewQuest.FEATURE_REQUEST,
      priority: ReviewPriority.MEDIUM,
    };

    renderWithTheme(<CreateQuestButton review={featureRequestReview} />);
    
    const button = screen.getByRole('button', { name: /create quest/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('initial-type')).toHaveTextContent('FEATURE_REQUEST');
    expect(screen.getByTestId('initial-priority')).toHaveTextContent('MEDIUM');
  });

  it('handles review with no quest type', () => {
    const reviewWithoutQuest: Review = {
      ...mockReview,
      quest: undefined,
      priority: undefined,
    };

    renderWithTheme(<CreateQuestButton review={reviewWithoutQuest} />);
    
    const button = screen.getByRole('button', { name: /create quest/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('initial-type')).toHaveTextContent('IMPROVEMENT');
    expect(screen.getByTestId('initial-priority')).toHaveTextContent('MEDIUM');
  });

  it('truncates long review comments in title', () => {
    const longCommentReview: Review = {
      ...mockReview,
      comment: 'This is a very long comment that should be truncated when used as the quest title because it exceeds the maximum length',
    };

    renderWithTheme(<CreateQuestButton review={longCommentReview} />);
    
    const button = screen.getByRole('button', { name: /create quest/i });
    fireEvent.click(button);
    
    const titleElement = screen.getByTestId('initial-title');
    expect(titleElement.textContent).toContain('...');
    expect(titleElement.textContent?.length).toBeLessThan(longCommentReview.comment.length + 20);
  });
});
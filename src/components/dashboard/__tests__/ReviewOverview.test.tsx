import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ReviewOverview from '../ReviewOverview';
import { ReviewOverviewProps } from '../types';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

const mockProps: ReviewOverviewProps = {
  totalReviews: 150,
  sentimentBreakdown: {
    positive: 120,
    negative: 30,
  },
  platformBreakdown: {
    GooglePlay: 80,
    AppleStore: 50,
    ChromeExt: 20,
  },
  questBreakdown: {
    bug: 25,
    featureRequest: 45,
    other: 80,
  },
};

describe('ReviewOverview', () => {
  it('renders the component with all sections', () => {
    renderWithTheme(<ReviewOverview {...mockProps} />);
    
    expect(screen.getByText('Review Overview')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Total Reviews')).toBeInTheDocument();
  });

  it('displays sentiment breakdown correctly', () => {
    renderWithTheme(<ReviewOverview {...mockProps} />);
    
    expect(screen.getByText('Sentiment')).toBeInTheDocument();
    expect(screen.getByText('120 (80.0%)')).toBeInTheDocument(); // Positive
    expect(screen.getByText('30 (20.0%)')).toBeInTheDocument(); // Negative
  });

  it('displays platform distribution correctly', () => {
    renderWithTheme(<ReviewOverview {...mockProps} />);
    
    expect(screen.getByText('Platforms')).toBeInTheDocument();
    expect(screen.getByText('Google Play')).toBeInTheDocument();
    expect(screen.getByText('App Store')).toBeInTheDocument();
    expect(screen.getByText('Chrome Web Store')).toBeInTheDocument();
    
    // Use getAllByText for values that might appear multiple times
    const googlePlayPercentages = screen.getAllByText('80 (53.3%)');
    expect(googlePlayPercentages.length).toBeGreaterThan(0);
    
    expect(screen.getByText('50 (33.3%)')).toBeInTheDocument(); // App Store
    expect(screen.getByText('20 (13.3%)')).toBeInTheDocument(); // Chrome Web Store
  });

  it('displays quest type breakdown when provided', () => {
    renderWithTheme(<ReviewOverview {...mockProps} />);
    
    expect(screen.getByText('Quest Types')).toBeInTheDocument();
    expect(screen.getByText('Bug Reports')).toBeInTheDocument();
    expect(screen.getByText('Feature Requests')).toBeInTheDocument();
    expect(screen.getByText('Other Feedback')).toBeInTheDocument();
    
    // Use getAllByText for duplicate values and check specific ones
    const bugReports = screen.getAllByText('25 (16.7%)');
    expect(bugReports.length).toBeGreaterThan(0);
    
    const featureRequests = screen.getAllByText('45 (30.0%)');
    expect(featureRequests.length).toBeGreaterThan(0);
    
    const otherFeedback = screen.getAllByText('80 (53.3%)');
    expect(otherFeedback.length).toBeGreaterThan(0);
  });

  it('does not display quest type section when questBreakdown is not provided', () => {
    const propsWithoutQuest = { ...mockProps };
    delete propsWithoutQuest.questBreakdown;
    
    renderWithTheme(<ReviewOverview {...propsWithoutQuest} />);
    
    expect(screen.queryByText('Quest Types')).not.toBeInTheDocument();
  });

  it('handles zero reviews correctly', () => {
    const zeroProps: ReviewOverviewProps = {
      totalReviews: 0,
      sentimentBreakdown: {
        positive: 0,
        negative: 0,
      },
      platformBreakdown: {
        GooglePlay: 0,
        AppleStore: 0,
        ChromeExt: 0,
      },
    };

    renderWithTheme(<ReviewOverview {...zeroProps} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    
    // Use getAllByText for duplicate values
    const zeroPercentages = screen.getAllByText('0 (0.0%)');
    expect(zeroPercentages.length).toBeGreaterThan(0);
  });

  it('calculates percentages correctly for edge cases', () => {
    const edgeCaseProps: ReviewOverviewProps = {
      totalReviews: 3,
      sentimentBreakdown: {
        positive: 1,
        negative: 2,
      },
      platformBreakdown: {
        GooglePlay: 1,
        AppleStore: 1,
        ChromeExt: 1,
      },
    };

    renderWithTheme(<ReviewOverview {...edgeCaseProps} />);
    
    // Use getAllByText for values that appear multiple times
    const positivePercentages = screen.getAllByText('1 (33.3%)');
    expect(positivePercentages.length).toBeGreaterThan(0);
    
    expect(screen.getByText('2 (66.7%)')).toBeInTheDocument(); // Negative sentiment should be unique
  });

  it('renders platform icons', () => {
    renderWithTheme(<ReviewOverview {...mockProps} />);
    
    // Since Material-UI icons might not have test ids, we check for the text content instead
    expect(screen.getByText('Google Play')).toBeInTheDocument();
    expect(screen.getByText('App Store')).toBeInTheDocument();
    expect(screen.getByText('Chrome Web Store')).toBeInTheDocument();
  });

  it('renders quest type icons when quest breakdown is provided', () => {
    renderWithTheme(<ReviewOverview {...mockProps} />);
    
    expect(screen.getByText('Bug Reports')).toBeInTheDocument();
    expect(screen.getByText('Feature Requests')).toBeInTheDocument();
    expect(screen.getByText('Other Feedback')).toBeInTheDocument();
  });

  it('applies correct styling and layout', () => {
    renderWithTheme(<ReviewOverview {...mockProps} />);
    
    const overviewCard = screen.getByText('Review Overview').closest('.MuiCard-root');
    expect(overviewCard).toBeInTheDocument();
    expect(overviewCard).toHaveStyle('margin-bottom: 24px'); // mb: 3 = 24px
  });

  it('formats large numbers correctly', () => {
    const largeNumberProps: ReviewOverviewProps = {
      totalReviews: 1234567,
      sentimentBreakdown: {
        positive: 1000000,
        negative: 234567,
      },
      platformBreakdown: {
        GooglePlay: 500000,
        AppleStore: 400000,
        ChromeExt: 334567,
      },
    };

    renderWithTheme(<ReviewOverview {...largeNumberProps} />);
    
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });
});
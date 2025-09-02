import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { axe, toHaveNoViolations } from 'jest-axe';
import ReviewOverview from '../ReviewOverview';
import { ReviewOverviewProps } from '../types';

expect.extend(toHaveNoViolations);

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

describe('ReviewOverview Accessibility', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = renderWithTheme(<ReviewOverview {...mockProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations without quest breakdown', async () => {
    const propsWithoutQuest = { ...mockProps };
    delete propsWithoutQuest.questBreakdown;
    
    const { container } = renderWithTheme(<ReviewOverview {...propsWithoutQuest} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with zero data', async () => {
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

    const { container } = renderWithTheme(<ReviewOverview {...zeroProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading structure', () => {
    const { container } = renderWithTheme(<ReviewOverview {...mockProps} />);
    
    // Check for proper heading hierarchy
    const mainHeading = container.querySelector('h1');
    expect(mainHeading).toBeInTheDocument();
    expect(mainHeading).toHaveTextContent('Review Overview');
    
    // Check for section headings
    const sectionHeadings = container.querySelectorAll('h2');
    expect(sectionHeadings.length).toBeGreaterThan(0);
  });

  it('should have sufficient color contrast for visual indicators', () => {
    const { container } = renderWithTheme(<ReviewOverview {...mockProps} />);
    
    // Check that progress bars and chips have proper contrast
    const progressBars = container.querySelectorAll('.MuiLinearProgress-bar');
    expect(progressBars.length).toBeGreaterThan(0);
    
    const chips = container.querySelectorAll('.MuiChip-root');
    expect(chips.length).toBeGreaterThan(0);
  });

  it('should provide meaningful text content for screen readers', () => {
    const { container } = renderWithTheme(<ReviewOverview {...mockProps} />);
    
    // Check that all important information is available as text
    expect(container).toHaveTextContent('150');
    expect(container).toHaveTextContent('Total Reviews');
    expect(container).toHaveTextContent('Sentiment');
    expect(container).toHaveTextContent('Platforms');
    expect(container).toHaveTextContent('Quest Types');
    
    // Check that percentages are included for context
    expect(container).toHaveTextContent('80.0%');
    expect(container).toHaveTextContent('20.0%');
  });

  it('should have proper semantic structure', () => {
    const { container } = renderWithTheme(<ReviewOverview {...mockProps} />);
    
    // Check for proper use of semantic elements
    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
    
    const cardContent = container.querySelector('.MuiCardContent-root');
    expect(cardContent).toBeInTheDocument();
    
    // Check for proper grid structure
    const gridItems = container.querySelectorAll('.MuiGrid-item');
    expect(gridItems.length).toBeGreaterThan(0);
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import CTASection from '../CTASection';

const theme = createTheme();

const mockProps = {
  title: 'Test CTA Title',
  description: 'Test CTA Description',
  ctaText: 'Get Started',
  onCtaClick: jest.fn(),
  variant: 'primary' as const
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('CTASection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders primary CTA with title and description', () => {
    renderWithTheme(<CTASection {...mockProps} />);
    
    expect(screen.getByText('Test CTA Title')).toBeInTheDocument();
    expect(screen.getByText('Test CTA Description')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('calls onCtaClick when primary button is clicked', () => {
    renderWithTheme(<CTASection {...mockProps} />);
    
    const primaryButton = screen.getByText('Get Started');
    fireEvent.click(primaryButton);
    
    expect(mockProps.onCtaClick).toHaveBeenCalledTimes(1);
  });

  it('renders secondary actions when provided', () => {
    const secondaryActions = [
      { text: 'Learn More', onClick: jest.fn() },
      { text: 'See Demo', onClick: jest.fn() }
    ];

    renderWithTheme(
      <CTASection 
        {...mockProps} 
        secondaryActions={secondaryActions}
      />
    );
    
    expect(screen.getByText('Learn More')).toBeInTheDocument();
    expect(screen.getByText('See Demo')).toBeInTheDocument();
  });

  it('calls secondary action handlers when clicked', () => {
    const learnMoreHandler = jest.fn();
    const demoHandler = jest.fn();
    
    const secondaryActions = [
      { text: 'Learn More', onClick: learnMoreHandler },
      { text: 'See Demo', onClick: demoHandler }
    ];

    renderWithTheme(
      <CTASection 
        {...mockProps} 
        secondaryActions={secondaryActions}
      />
    );
    
    fireEvent.click(screen.getByText('Learn More'));
    fireEvent.click(screen.getByText('See Demo'));
    
    expect(learnMoreHandler).toHaveBeenCalledTimes(1);
    expect(demoHandler).toHaveBeenCalledTimes(1);
  });

  it('renders without description when not provided', () => {
    const propsWithoutDescription = {
      ...mockProps,
      description: undefined
    };

    renderWithTheme(<CTASection {...propsWithoutDescription} />);
    
    expect(screen.getByText('Test CTA Title')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.queryByText('Test CTA Description')).not.toBeInTheDocument();
  });
});
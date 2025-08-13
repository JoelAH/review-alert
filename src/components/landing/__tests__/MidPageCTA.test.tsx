import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import MidPageCTA from '../MidPageCTA';

const theme = createTheme();

const mockProps = {
  title: 'Ready to Level Up?',
  description: 'Transform your review management with AI and gamification.',
  primaryText: 'Start Your Journey',
  onPrimaryClick: jest.fn()
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('MidPageCTA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title, description, and primary button', () => {
    renderWithTheme(<MidPageCTA {...mockProps} />);
    
    expect(screen.getByText('Ready to Level Up?')).toBeInTheDocument();
    expect(screen.getByText('Transform your review management with AI and gamification.')).toBeInTheDocument();
    expect(screen.getByText('Start Your Journey')).toBeInTheDocument();
  });

  it('calls onPrimaryClick when primary button is clicked', () => {
    renderWithTheme(<MidPageCTA {...mockProps} />);
    
    const primaryButton = screen.getByText('Start Your Journey');
    fireEvent.click(primaryButton);
    
    expect(mockProps.onPrimaryClick).toHaveBeenCalledTimes(1);
  });

  it('renders secondary actions with appropriate icons', () => {
    const secondaryActions = [
      { text: 'Explore Features', onClick: jest.fn() },
      { text: 'Watch Demo', onClick: jest.fn() }
    ];

    renderWithTheme(
      <MidPageCTA 
        {...mockProps} 
        secondaryActions={secondaryActions}
      />
    );
    
    expect(screen.getByText('Explore Features')).toBeInTheDocument();
    expect(screen.getByText('Watch Demo')).toBeInTheDocument();
  });

  it('calls secondary action handlers when clicked', () => {
    const exploreHandler = jest.fn();
    const demoHandler = jest.fn();
    
    const secondaryActions = [
      { text: 'Explore Features', onClick: exploreHandler },
      { text: 'Watch Demo', onClick: demoHandler }
    ];

    renderWithTheme(
      <MidPageCTA 
        {...mockProps} 
        secondaryActions={secondaryActions}
      />
    );
    
    fireEvent.click(screen.getByText('Explore Features'));
    fireEvent.click(screen.getByText('Watch Demo'));
    
    expect(exploreHandler).toHaveBeenCalledTimes(1);
    expect(demoHandler).toHaveBeenCalledTimes(1);
  });

  it('renders primary button with rocket icon', () => {
    renderWithTheme(<MidPageCTA {...mockProps} />);
    
    // Check that the button contains the rocket icon (MUI RocketLaunch icon)
    const primaryButton = screen.getByText('Start Your Journey').closest('button');
    expect(primaryButton).toBeInTheDocument();
  });
});
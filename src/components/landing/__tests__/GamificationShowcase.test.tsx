import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import GamificationShowcase from '../GamificationShowcase';
import { GamificationShowcaseProps } from '@/types/landing';

// Create a basic theme for testing
const theme = createTheme();

const mockProps: GamificationShowcaseProps = {
  currentXP: 1250,
  currentLevel: 3,
  nextLevelXP: 2000,
  recentTasks: [
    {
      id: "1",
      title: "Respond to 5 negative reviews",
      xpReward: 150,
      completed: true
    },
    {
      id: "2",
      title: "Fix bug mentioned in reviews",
      xpReward: 300,
      completed: true
    },
    {
      id: "3",
      title: "Implement feature request",
      xpReward: 500,
      completed: false
    }
  ]
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('GamificationShowcase', () => {
  it('renders the component title', () => {
    renderWithTheme(<GamificationShowcase {...mockProps} />);
    expect(screen.getByText('Level Up Your Review Management')).toBeInTheDocument();
  });

  it('displays current level and XP correctly', () => {
    renderWithTheme(<GamificationShowcase {...mockProps} />);
    expect(screen.getByText('Level 3 Developer')).toBeInTheDocument();
    expect(screen.getByText('1250 / 2000 XP')).toBeInTheDocument();
  });

  it('shows XP needed for next level', () => {
    renderWithTheme(<GamificationShowcase {...mockProps} />);
    expect(screen.getByText('750 XP until Level 4')).toBeInTheDocument();
  });

  it('renders achievement badges section', () => {
    renderWithTheme(<GamificationShowcase {...mockProps} />);
    expect(screen.getByText('Achievement Badges')).toBeInTheDocument();
  });

  it('displays recent tasks with correct completion status', () => {
    renderWithTheme(<GamificationShowcase {...mockProps} />);
    expect(screen.getByText('Recent Tasks & XP Rewards')).toBeInTheDocument();
    expect(screen.getByText('Respond to 5 negative reviews')).toBeInTheDocument();
    expect(screen.getByText('Fix bug mentioned in reviews')).toBeInTheDocument();
    expect(screen.getByText('Implement feature request')).toBeInTheDocument();
  });

  it('shows XP rewards for tasks', () => {
    renderWithTheme(<GamificationShowcase {...mockProps} />);
    expect(screen.getByText('+150 XP')).toBeInTheDocument();
    expect(screen.getByText('+300 XP')).toBeInTheDocument();
    expect(screen.getByText('+500 XP')).toBeInTheDocument();
  });

  it('displays motivational message', () => {
    renderWithTheme(<GamificationShowcase {...mockProps} />);
    expect(screen.getByText('Complete tasks to earn XP and unlock new achievements!')).toBeInTheDocument();
  });
});
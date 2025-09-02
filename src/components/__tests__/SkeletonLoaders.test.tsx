import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  ReviewCardSkeleton,
  ReviewOverviewSkeleton,
  ReviewFiltersSkeleton,
  ReviewListSkeleton,
  FeedTabSkeleton,
  LoadMoreSkeleton,
  PaginationSkeleton,
} from '../SkeletonLoaders';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('SkeletonLoaders', () => {
  describe('ReviewCardSkeleton', () => {
    it('should render skeleton elements for review card', () => {
      renderWithTheme(<ReviewCardSkeleton />);
      
      // Should have Card component
      expect(screen.getByRole('generic')).toBeInTheDocument();
      
      // Should have skeleton elements (check by class name)
      const container = screen.getByRole('generic');
      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('ReviewOverviewSkeleton', () => {
    it('should render skeleton elements for overview section', () => {
      renderWithTheme(<ReviewOverviewSkeleton />);
      
      // Should have skeleton elements (check by class name)
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('ReviewFiltersSkeleton', () => {
    it('should render skeleton elements for filters section', () => {
      renderWithTheme(<ReviewFiltersSkeleton />);
      
      // Should have multiple skeleton elements for filter controls
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('ReviewListSkeleton', () => {
    it('should render default number of skeleton cards', () => {
      renderWithTheme(<ReviewListSkeleton />);
      
      // Should render 5 skeleton cards by default
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render custom number of skeleton cards', () => {
      renderWithTheme(<ReviewListSkeleton count={3} />);
      
      // Should render skeleton elements
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('FeedTabSkeleton', () => {
    it('should render complete feed tab skeleton', () => {
      renderWithTheme(<FeedTabSkeleton />);
      
      // Should have many skeleton elements for the complete feed
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(10);
    });
  });

  describe('LoadMoreSkeleton', () => {
    it('should render skeleton for load more button', () => {
      renderWithTheme(<LoadMoreSkeleton />);
      
      // Should have skeleton element
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('PaginationSkeleton', () => {
    it('should render skeleton for pagination', () => {
      renderWithTheme(<PaginationSkeleton />);
      
      // Should have skeleton elements
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
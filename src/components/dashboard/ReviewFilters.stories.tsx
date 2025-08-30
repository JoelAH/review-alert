import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ReviewFilters from './ReviewFilters';
import { ReviewFiltersProps } from './types';

const theme = createTheme();

const meta: Meta<typeof ReviewFilters> = {
  title: 'Dashboard/ReviewFilters',
  component: ReviewFilters,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A comprehensive filtering component for review data with platform, rating, sentiment, quest type, and search functionality.',
      },
    },
  },
  argTypes: {
    filters: {
      description: 'Current filter state object',
      control: 'object',
    },
    onFiltersChange: {
      description: 'Callback function called when filters change',
      action: 'filtersChanged',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReviewFilters>;

// Default story with no filters
export const Default: Story = {
  args: {
    filters: {},
    onFiltersChange: action('onFiltersChange'),
  },
};

// Story with single filter applied
export const WithPlatformFilter: Story = {
  args: {
    filters: {
      platform: 'GooglePlay',
    },
    onFiltersChange: action('onFiltersChange'),
  },
};

// Story with multiple filters applied
export const WithMultipleFilters: Story = {
  args: {
    filters: {
      platform: 'AppleStore',
      rating: 5,
      sentiment: 'POSITIVE',
    },
    onFiltersChange: action('onFiltersChange'),
  },
};

// Story with all filters applied
export const WithAllFilters: Story = {
  args: {
    filters: {
      platform: 'ChromeExt',
      rating: 4,
      sentiment: 'NEGATIVE',
      quest: 'BUG',
      search: 'crash issue',
    },
    onFiltersChange: action('onFiltersChange'),
  },
};

// Story with search filter only
export const WithSearchFilter: Story = {
  args: {
    filters: {
      search: 'great app love it',
    },
    onFiltersChange: action('onFiltersChange'),
  },
};

// Story with rating and sentiment filters
export const WithRatingAndSentiment: Story = {
  args: {
    filters: {
      rating: 1,
      sentiment: 'NEGATIVE',
    },
    onFiltersChange: action('onFiltersChange'),
  },
};

// Story with quest type filter
export const WithQuestTypeFilter: Story = {
  args: {
    filters: {
      quest: 'FEATURE_REQUEST',
    },
    onFiltersChange: action('onFiltersChange'),
  },
};

// Interactive story for testing
export const Interactive: Story = {
  args: {
    filters: {},
    onFiltersChange: action('onFiltersChange'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive version where you can test all filter combinations. Check the Actions panel to see filter changes.',
      },
    },
  },
};

// Story demonstrating responsive behavior
export const ResponsiveDemo: Story = {
  args: {
    filters: {
      platform: 'GooglePlay',
      rating: 5,
      sentiment: 'POSITIVE',
      quest: 'FEATURE_REQUEST',
      search: 'responsive design',
    },
    onFiltersChange: action('onFiltersChange'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Demonstrates how the component adapts to smaller screen sizes.',
      },
    },
  },
};

// Story showing edge cases
export const EdgeCases: Story = {
  args: {
    filters: {
      search: 'Very long search query that might wrap to multiple lines and test the layout behavior',
      platform: 'GooglePlay',
    },
    onFiltersChange: action('onFiltersChange'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests edge cases like very long search queries and layout behavior.',
      },
    },
  },
};
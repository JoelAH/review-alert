import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ReviewOverview from './ReviewOverview';
import { ReviewOverviewProps } from './types';

const theme = createTheme();

const meta: Meta<typeof ReviewOverview> = {
  title: 'Dashboard/ReviewOverview',
  component: ReviewOverview,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultProps: ReviewOverviewProps = {
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

export const Default: Story = {
  args: defaultProps,
};

export const WithoutQuestBreakdown: Story = {
  args: {
    ...defaultProps,
    questBreakdown: undefined,
  },
};

export const ZeroReviews: Story = {
  args: {
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
  },
};

export const HighVolumeReviews: Story = {
  args: {
    totalReviews: 12567,
    sentimentBreakdown: {
      positive: 9500,
      negative: 3067,
    },
    platformBreakdown: {
      GooglePlay: 7500,
      AppleStore: 3500,
      ChromeExt: 1567,
    },
    questBreakdown: {
      bug: 1200,
      featureRequest: 2800,
      other: 8567,
    },
  },
};

export const MostlyNegative: Story = {
  args: {
    totalReviews: 100,
    sentimentBreakdown: {
      positive: 15,
      negative: 85,
    },
    platformBreakdown: {
      GooglePlay: 60,
      AppleStore: 30,
      ChromeExt: 10,
    },
    questBreakdown: {
      bug: 70,
      featureRequest: 20,
      other: 10,
    },
  },
};

export const SinglePlatform: Story = {
  args: {
    totalReviews: 75,
    sentimentBreakdown: {
      positive: 60,
      negative: 15,
    },
    platformBreakdown: {
      GooglePlay: 75,
      AppleStore: 0,
      ChromeExt: 0,
    },
    questBreakdown: {
      bug: 10,
      featureRequest: 25,
      other: 40,
    },
  },
};

export const EqualDistribution: Story = {
  args: {
    totalReviews: 90,
    sentimentBreakdown: {
      positive: 45,
      negative: 45,
    },
    platformBreakdown: {
      GooglePlay: 30,
      AppleStore: 30,
      ChromeExt: 30,
    },
    questBreakdown: {
      bug: 30,
      featureRequest: 30,
      other: 30,
    },
  },
};
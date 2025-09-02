import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';
import ReviewCard from './ReviewCard';
import { Review, ReviewSentiment, ReviewQuest, ReviewPriority } from '@/lib/models/client/review';
import theme from '@/app/theme';

// Sample review data for different scenarios
const positiveReview: Review = {
  _id: '1',
  user: 'user123',
  appId: 'app123',
  name: 'Sarah Johnson',
  comment: 'Amazing app! The new features work perfectly and the interface is so intuitive. Highly recommend to everyone!',
  date: new Date('2024-01-15'),
  rating: 5,
  sentiment: ReviewSentiment.POSITIVE,
  quest: ReviewQuest.FEATURE_REQUEST,
  priority: ReviewPriority.LOW,
};

const negativeReview: Review = {
  _id: '2',
  user: 'user456',
  appId: 'app123',
  name: 'Mike Chen',
  comment: 'The app keeps crashing when I try to save my work. This is really frustrating and needs to be fixed ASAP.',
  date: new Date('2024-01-14'),
  rating: 1,
  sentiment: ReviewSentiment.NEGATIVE,
  quest: ReviewQuest.BUG,
  priority: ReviewPriority.HIGH,
};

const mediumPriorityReview: Review = {
  _id: '3',
  user: 'user789',
  appId: 'app123',
  name: 'Alex Rodriguez',
  comment: 'Good app overall, but it would be great if you could add dark mode support. The current theme is a bit bright for night use.',
  date: new Date('2024-01-13'),
  rating: 4,
  sentiment: ReviewSentiment.POSITIVE,
  quest: ReviewQuest.FEATURE_REQUEST,
  priority: ReviewPriority.MEDIUM,
};

const otherFeedbackReview: Review = {
  _id: '4',
  user: 'user101',
  appId: 'app123',
  name: 'Emma Wilson',
  comment: 'Just wanted to say thanks for creating this app. It has made my workflow so much easier!',
  date: new Date('2024-01-12'),
  rating: 5,
  sentiment: ReviewSentiment.POSITIVE,
  quest: ReviewQuest.OTHER,
  priority: ReviewPriority.LOW,
};

const minimalReview: Review = {
  _id: '5',
  user: 'user202',
  appId: 'app123',
  name: 'John Smith',
  comment: 'Works as expected.',
  date: new Date('2024-01-11'),
  rating: 3,
  sentiment: ReviewSentiment.POSITIVE,
  // No quest or priority
};

const ReviewCardDemo = () => {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <h1>ReviewCard Component Demo</h1>
        
        <h2>Google Play Store Reviews</h2>
        <ReviewCard
          review={positiveReview}
          appName="My Awesome App"
          platform="GooglePlay"
        />
        
        <ReviewCard
          review={negativeReview}
          appName="My Awesome App"
          platform="GooglePlay"
        />
        
        <h2>Apple App Store Reviews</h2>
        <ReviewCard
          review={mediumPriorityReview}
          appName="iOS App Pro"
          platform="AppleStore"
        />
        
        <h2>Chrome Web Store Reviews</h2>
        <ReviewCard
          review={otherFeedbackReview}
          appName="Chrome Extension Helper"
          platform="ChromeExt"
        />
        
        <h2>Minimal Review (No Quest/Priority)</h2>
        <ReviewCard
          review={minimalReview}
          appName="Simple App"
          platform="GooglePlay"
        />
      </Box>
    </ThemeProvider>
  );
};

export default ReviewCardDemo;
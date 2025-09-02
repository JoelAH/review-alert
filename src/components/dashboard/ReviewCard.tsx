'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Rating,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Android as AndroidIcon,
  Apple as AppleIcon,
  Extension as ExtensionIcon,
  BugReport as BugIcon,
  Lightbulb as LightbulbIcon,
  HelpOutline as QuestionIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { ReviewSentiment, ReviewQuest, ReviewPriority } from '@/lib/models/client/review';
import { ReviewCardProps } from './types';
import CreateQuestButton from './CreateQuestButton';

const ReviewCard: React.FC<ReviewCardProps> = React.memo(({ review, appName, platform, onQuestCreated }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Platform icon and tooltip mapping
  const getPlatformIcon = () => {
    switch (platform) {
      case 'GooglePlay':
        return (
          <Tooltip title="Google Play" arrow>
            <AndroidIcon sx={{ color: '#4CAF50', fontSize: isMobile ? 20 : 24 }} />
          </Tooltip>
        );
      case 'AppleStore':
        return (
          <Tooltip title="App Store" arrow>
            <AppleIcon sx={{ color: '#000000', fontSize: isMobile ? 20 : 24 }} />
          </Tooltip>
        );
      case 'ChromeExt':
        return (
          <Tooltip title="Chrome Web Store" arrow>
            <ExtensionIcon sx={{ color: '#4285F4', fontSize: isMobile ? 20 : 24 }} />
          </Tooltip>
        );
      default:
        return null;
    }
  };

  // Quest type icon and tooltip mapping
  const getQuestIcon = () => {
    if (!review.quest) return null;

    switch (review.quest) {
      case ReviewQuest.BUG:
        return (
          <Tooltip title="Bug Report" arrow>
            <BugIcon sx={{ color: theme.palette.error.main, fontSize: isMobile ? 16 : 18 }} />
          </Tooltip>
        );
      case ReviewQuest.FEATURE_REQUEST:
        return (
          <Tooltip title="Feature Request" arrow>
            <LightbulbIcon sx={{ color: theme.palette.warning.main, fontSize: isMobile ? 16 : 18 }} />
          </Tooltip>
        );
      case ReviewQuest.OTHER:
        return (
          <Tooltip title="Other Feedback" arrow>
            <QuestionIcon sx={{ color: theme.palette.info.main, fontSize: isMobile ? 16 : 18 }} />
          </Tooltip>
        );
      default:
        return (
          <Tooltip title="Other Feedback" arrow>
            <QuestionIcon sx={{ color: theme.palette.info.main, fontSize: isMobile ? 16 : 18 }} />
          </Tooltip>
        );
    }
  };

  // Priority indicator with color and tooltip
  const getPriorityIndicator = () => {
    if (!review.priority) return null;

    const getPriorityColor = () => {
      switch (review.priority) {
        case ReviewPriority.HIGH:
          return theme.palette.error.main;
        case ReviewPriority.MEDIUM:
          return theme.palette.warning.main;
        case ReviewPriority.LOW:
          return theme.palette.grey[500];
        default:
          return theme.palette.grey[500];
      }
    };

    const getPriorityTooltip = () => {
      switch (review.priority) {
        case ReviewPriority.HIGH:
          return 'High Priority';
        case ReviewPriority.MEDIUM:
          return 'Medium Priority';
        case ReviewPriority.LOW:
          return 'Low Priority';
        default:
          return 'Priority';
      }
    };

    return (
      <Tooltip title={getPriorityTooltip()} arrow>
        <CircleIcon 
          sx={{ 
            color: getPriorityColor(), 
            fontSize: isMobile ? 12 : 14,
            ml: 0.5
          }} 
        />
      </Tooltip>
    );
  };

  // Sentiment border color
  const getSentimentBorderColor = () => {
    switch (review.sentiment) {
      case ReviewSentiment.POSITIVE:
        return theme.palette.success.main;
      case ReviewSentiment.NEGATIVE:
        return theme.palette.error.main;
      default:
        return theme.palette.grey[300];
    }
  };

  // Sentiment tooltip
  const getSentimentTooltip = () => {
    switch (review.sentiment) {
      case ReviewSentiment.POSITIVE:
        return 'Positive feedback';
      case ReviewSentiment.NEGATIVE:
        return 'Negative feedback';
      default:
        return 'Neutral feedback';
    }
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Tooltip title={getSentimentTooltip()} arrow placement="left">
      <Card
        sx={{
          mb: 2,
          borderLeft: `4px solid ${getSentimentBorderColor()}`,
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
            borderLeftWidth: '6px',
          },
          '@media (max-width: 600px)': {
            mb: 1.5,
            '&:hover': {
              transform: 'none', // Disable hover transform on mobile
              boxShadow: theme.shadows[2],
            },
          },
        }}
      >
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          {/* Header with platform, app name, indicators, and create quest button */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
              {getPlatformIcon()}
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {appName}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              <CreateQuestButton 
                review={review} 
                onQuestCreated={onQuestCreated}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {getQuestIcon()}
                {getPriorityIndicator()}
              </Box>
            </Box>
          </Box>

          {/* Reviewer name and date */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: theme.palette.text.secondary,
                fontSize: isMobile ? '0.75rem' : '0.875rem',
              }}
            >
              {review.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: isMobile ? '0.7rem' : '0.75rem',
              }}
            >
              {formatDate(review.date)}
            </Typography>
          </Box>

          {/* Rating */}
          <Box sx={{ mb: 1.5 }}>
            <Rating
              value={review.rating}
              readOnly
              size={isMobile ? 'small' : 'medium'}
              sx={{
                '& .MuiRating-iconFilled': {
                  color: theme.palette.warning.main,
                },
              }}
            />
          </Box>

          {/* Review comment */}
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.primary,
              lineHeight: 1.5,
              fontSize: isMobile ? '0.875rem' : '1rem',
              wordBreak: 'break-word',
            }}
          >
            {review.comment}
          </Typography>
        </CardContent>
      </Card>
    </Tooltip>
  );
});

ReviewCard.displayName = 'ReviewCard';

export default ReviewCard;
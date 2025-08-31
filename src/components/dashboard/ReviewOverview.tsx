'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Android as AndroidIcon,
  Apple as AppleIcon,
  Extension as ExtensionIcon,
  BugReport as BugIcon,
  Lightbulb as LightbulbIcon,
  Help as HelpIcon,
  TrendingUp as PositiveIcon,
  TrendingDown as NegativeIcon,
} from '@mui/icons-material';
import { ReviewOverviewProps } from './types';

const ReviewOverview: React.FC<ReviewOverviewProps> = React.memo(({
  totalReviews,
  sentimentBreakdown,
  platformBreakdown,
  questBreakdown,
}) => {
  const theme = useTheme();

  // Calculate percentages
  const positivePercentage = totalReviews > 0 ? (sentimentBreakdown.positive / totalReviews) * 100 : 0;
  const negativePercentage = totalReviews > 0 ? (sentimentBreakdown.negative / totalReviews) * 100 : 0;

  const platformData = [
    {
      name: 'Google Play',
      key: 'GooglePlay' as const,
      count: platformBreakdown.GooglePlay,
      percentage: totalReviews > 0 ? (platformBreakdown.GooglePlay / totalReviews) * 100 : 0,
      icon: <AndroidIcon sx={{ color: '#4CAF50' }} />,
      color: '#4CAF50',
    },
    {
      name: 'App Store',
      key: 'AppleStore' as const,
      count: platformBreakdown.AppleStore,
      percentage: totalReviews > 0 ? (platformBreakdown.AppleStore / totalReviews) * 100 : 0,
      icon: <AppleIcon sx={{ color: '#000000' }} />,
      color: '#000000',
    },
    {
      name: 'Chrome Web Store',
      key: 'ChromeExt' as const,
      count: platformBreakdown.ChromeExt,
      percentage: totalReviews > 0 ? (platformBreakdown.ChromeExt / totalReviews) * 100 : 0,
      icon: <ExtensionIcon sx={{ color: '#4285F4' }} />,
      color: '#4285F4',
    },
  ];

  const questData = questBreakdown ? [
    {
      name: 'Bug Reports',
      count: questBreakdown.bug,
      percentage: totalReviews > 0 ? (questBreakdown.bug / totalReviews) * 100 : 0,
      icon: <BugIcon sx={{ color: '#F44336' }} />,
      color: '#F44336',
    },
    {
      name: 'Feature Requests',
      count: questBreakdown.featureRequest,
      percentage: totalReviews > 0 ? (questBreakdown.featureRequest / totalReviews) * 100 : 0,
      icon: <LightbulbIcon sx={{ color: '#FF9800' }} />,
      color: '#FF9800',
    },
    {
      name: 'Other Feedback',
      count: questBreakdown.other,
      percentage: totalReviews > 0 ? (questBreakdown.other / totalReviews) * 100 : 0,
      icon: <HelpIcon sx={{ color: '#9E9E9E' }} />,
      color: '#9E9E9E',
    },
  ] : [];

  return (
    <Card
      sx={{
        mb: 3,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: `2px solid ${theme.palette.primary.main}`,
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: theme.palette.primary.main,
            mb: 3,
            textAlign: 'center',
          }}
        >
          Review Overview
        </Typography>

        <Grid container spacing={3}>
          {/* Total Reviews */}
          <Grid item xs={12} md={3}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography variant="h3" component="div" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: '3rem' }}>
                {totalReviews.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Reviews
              </Typography>
            </Box>
          </Grid>

          {/* Sentiment Breakdown */}
          <Grid item xs={12} md={3}>
            <Box
              sx={{
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.1)',
                height: '100%',
              }}
            >
              <Typography variant="h2" gutterBottom sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                Sentiment
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PositiveIcon sx={{ color: '#4CAF50', mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    Positive
                  </Typography>
                  <Chip
                    label={`${sentimentBreakdown.positive} (${positivePercentage.toFixed(1)}%)`}
                    size="small"
                    sx={{ backgroundColor: '#4CAF50', color: 'white', fontSize: '0.75rem' }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={positivePercentage}
                  aria-label={`Positive sentiment: ${positivePercentage.toFixed(1)}%`}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    '& .MuiLinearProgress-bar': { backgroundColor: '#4CAF50' },
                  }}
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <NegativeIcon sx={{ color: '#F44336', mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    Negative
                  </Typography>
                  <Chip
                    label={`${sentimentBreakdown.negative} (${negativePercentage.toFixed(1)}%)`}
                    size="small"
                    sx={{ backgroundColor: '#F44336', color: 'white', fontSize: '0.75rem' }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={negativePercentage}
                  aria-label={`Negative sentiment: ${negativePercentage.toFixed(1)}%`}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(244, 67, 54, 0.2)',
                    '& .MuiLinearProgress-bar': { backgroundColor: '#F44336' },
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Platform Distribution */}
          <Grid item xs={12} md={3}>
            <Box
              sx={{
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.1)',
                height: '100%',
              }}
            >
              <Typography variant="h2" gutterBottom sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                Platforms
              </Typography>
              {platformData.map((platform) => (
                <Box key={platform.key} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    {platform.icon}
                    <Typography variant="body2" sx={{ ml: 1, flexGrow: 1, fontSize: '0.875rem' }}>
                      {platform.name}
                    </Typography>
                    <Chip
                      label={`${platform.count} (${platform.percentage.toFixed(1)}%)`}
                      size="small"
                      sx={{
                        backgroundColor: platform.color,
                        color: platform.key === 'AppleStore' ? 'white' : 'white',
                        fontSize: '0.7rem',
                        height: 20,
                      }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={platform.percentage}
                    aria-label={`${platform.name}: ${platform.percentage.toFixed(1)}%`}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: `${platform.color}20`,
                      '& .MuiLinearProgress-bar': { backgroundColor: platform.color },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Quest Type Distribution */}
          {questBreakdown && (
            <Grid item xs={12} md={3}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: 2,
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  height: '100%',
                }}
              >
                <Typography variant="h2" gutterBottom sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                  Quest Types
                </Typography>
                {questData.map((quest, index) => (
                  <Box key={index} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      {quest.icon}
                      <Typography variant="body2" sx={{ ml: 1, flexGrow: 1, fontSize: '0.875rem' }}>
                        {quest.name}
                      </Typography>
                      <Chip
                        label={`${quest.count} (${quest.percentage.toFixed(1)}%)`}
                        size="small"
                        sx={{
                          backgroundColor: quest.color,
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={quest.percentage}
                      aria-label={`${quest.name}: ${quest.percentage.toFixed(1)}%`}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: `${quest.color}20`,
                        '& .MuiLinearProgress-bar': { backgroundColor: quest.color },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
});

ReviewOverview.displayName = 'ReviewOverview';

export default ReviewOverview;
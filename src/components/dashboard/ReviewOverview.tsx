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
        mb: 2,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: `2px solid ${theme.palette.primary.main}`,
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Typography
          variant="h6"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: theme.palette.primary.main,
            mb: 2,
            textAlign: 'center',
          }}
        >
          Review Overview
        </Typography>

        <Grid container spacing={2}>
          {/* Top Row: Total Reviews and Quest Type Pie Chart */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.1)',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box>
                <Typography variant="h3" component="div" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: '2.5rem' }}>
                  {totalReviews.toLocaleString()}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Reviews
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Quest Type Pie Chart */}
          {questBreakdown && (
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 1.5,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: 2,
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  Quest Types
                </Typography>
                
                {/* Simple CSS Pie Chart */}
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <Box sx={{ position: 'relative', width: 80, height: 80, mx: 'auto' }}>
                    {/* Pie Chart using conic-gradient */}
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: `conic-gradient(
                          #F44336 0deg ${(questBreakdown.bug / totalReviews) * 360}deg,
                          #FF9800 ${(questBreakdown.bug / totalReviews) * 360}deg ${((questBreakdown.bug + questBreakdown.featureRequest) / totalReviews) * 360}deg,
                          #9E9E9E ${((questBreakdown.bug + questBreakdown.featureRequest) / totalReviews) * 360}deg 360deg
                        )`,
                        position: 'relative',
                      }}
                    >
                      {/* Center circle */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '60%',
                          height: '60%',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                          {totalReviews}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                          Total
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Legend */}
                <Box sx={{ mt: 1 }}>
                  {questData.map((quest, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          backgroundColor: quest.color,
                          borderRadius: '50%',
                          mr: 0.5,
                        }}
                      />
                      <Typography variant="caption" sx={{ flexGrow: 1, fontSize: '0.65rem' }}>
                        {quest.name}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>
                        {quest.count}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          )}

          {/* Second Row: Sentiment Counters - Horizontal Layout */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: 1.5,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem', mb: 1 }}>
                Sentiment Analysis
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {/* Positive Counter */}
                <Box
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    p: 1.5,
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderRadius: 2,
                    border: '2px solid #4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                  }}
                >
                  <PositiveIcon sx={{ color: '#4CAF50', fontSize: 32 }} />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: '#4CAF50', fontSize: '1.8rem' }}>
                      {sentimentBreakdown.positive}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Positive Reviews
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {positivePercentage.toFixed(1)}% of total
                    </Typography>
                  </Box>
                </Box>

                {/* Negative Counter */}
                <Box
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    p: 1.5,
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    borderRadius: 2,
                    border: '2px solid #F44336',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                  }}
                >
                  <NegativeIcon sx={{ color: '#F44336', fontSize: 32 }} />
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: '#F44336', fontSize: '1.8rem' }}>
                      {sentimentBreakdown.negative}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Negative Reviews
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {negativePercentage.toFixed(1)}% of total
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Third Row: Platform Distribution - Horizontal Layout */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: 1.5,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem', mb: 1 }}>
                Platform Distribution
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {platformData.map((platform) => (
                  <Box key={platform.key} sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      {platform.icon}
                      <Typography variant="body2" sx={{ ml: 1, flexGrow: 1, fontWeight: 600 }}>
                        {platform.name}
                      </Typography>
                      <Chip
                        label={`${platform.count} (${platform.percentage.toFixed(1)}%)`}
                        size="small"
                        sx={{
                          backgroundColor: platform.color,
                          color: 'white',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          height: 18,
                        }}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={platform.percentage}
                      aria-label={`${platform.name}: ${platform.percentage.toFixed(1)}%`}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: `${platform.color}20`,
                        '& .MuiLinearProgress-bar': { backgroundColor: platform.color },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
});

ReviewOverview.displayName = 'ReviewOverview';

export default ReviewOverview;
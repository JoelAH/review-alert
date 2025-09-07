"use client";

import React from 'react';
import {
  Box,
  Skeleton,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  Lightbulb as SuggestionIcon,
} from '@mui/icons-material';

// Generic loading spinner
export function LoadingSpinner({ size = 40, message }: { size?: number; message?: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}

// Loading overlay for existing content
export function LoadingOverlay({ 
  loading, 
  children, 
  message = 'Loading...',
  backdrop = true 
}: { 
  loading: boolean; 
  children: React.ReactNode; 
  message?: string;
  backdrop?: boolean;
}) {
  const theme = useTheme();
  
  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: backdrop ? alpha(theme.palette.background.paper, 0.8) : 'transparent',
            zIndex: 1,
            borderRadius: 1,
          }}
        >
          <LoadingSpinner message={message} />
        </Box>
      )}
    </Box>
  );
}

// Progress bar for operations with known progress
export function ProgressLoader({ 
  progress, 
  message, 
  showPercentage = true 
}: { 
  progress: number; 
  message?: string; 
  showPercentage?: boolean;
}) {
  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {message && (
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            {message}
          </Typography>
        )}
        {showPercentage && (
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        )}
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  );
}

// Skeleton for XP Progress component
export function XPProgressSkeleton() {
  const theme = useTheme();
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon sx={{ color: theme.palette.primary.main }} />
            <Skeleton variant="text" width={120} height={24} />
          </Box>
          <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
        </Box>
        
        <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: 4, mb: 2 }} />
        <Skeleton variant="text" width={150} height={20} sx={{ mb: 2 }} />
        
        {/* Recent transactions skeleton */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Recent Activity
        </Typography>
        {[...Array(3)].map((_, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width={120} height={16} />
            <Skeleton variant="text" width={60} height={16} />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

// Skeleton for Badge Collection component
export function BadgeCollectionSkeleton() {
  const theme = useTheme();
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon sx={{ color: theme.palette.primary.main }} />
            <Skeleton variant="text" width={150} height={24} />
          </Box>
          <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} />
        </Box>
        
        <Grid container spacing={2}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Skeleton variant="circular" width={48} height={48} sx={{ mx: 'auto', mb: 1 }} />
                  <Skeleton variant="text" width="80%" height={16} sx={{ mx: 'auto', mb: 0.5 }} />
                  <Skeleton variant="rectangular" width={60} height={16} sx={{ mx: 'auto', borderRadius: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

// Skeleton for Progress Indicators component
export function ProgressIndicatorsSkeleton() {
  const theme = useTheme();
  
  return (
    <Box>
      {/* Motivational messages skeleton */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SuggestionIcon sx={{ color: theme.palette.primary.main }} />
              <Skeleton variant="text" width={120} height={24} />
            </Box>
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
          <Skeleton variant="text" width="90%" height={16} />
        </CardContent>
      </Card>
      
      {/* Header skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SuggestionIcon sx={{ color: theme.palette.primary.main }} />
          <Skeleton variant="text" width={180} height={24} />
          <Skeleton variant="rectangular" width={100} height={20} sx={{ borderRadius: 1 }} />
        </Box>
        <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
      </Box>
      
      {/* Suggestions grid skeleton */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        },
        gap: 2,
        mb: 3
      }}>
        {[...Array(3)].map((_, index) => (
          <Card key={index} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" height={18} />
                    <Skeleton variant="text" width="60%" height={14} />
                  </Box>
                </Box>
                <Skeleton variant="rectangular" width={50} height={20} sx={{ borderRadius: 1 }} />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Skeleton variant="text" width={60} height={14} />
                  <Skeleton variant="text" width={40} height={14} />
                </Box>
                <Skeleton variant="rectangular" width="100%" height={6} sx={{ borderRadius: 3 }} />
              </Box>
              
              <Skeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 1 }} />
            </CardContent>
          </Card>
        ))}
      </Box>
      
      {/* Summary stats skeleton */}
      <Card>
        <CardContent>
          <Skeleton variant="text" width={120} height={20} sx={{ mb: 2 }} />
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: 2 
          }}>
            {[...Array(4)].map((_, index) => (
              <Box key={index} sx={{ textAlign: 'center' }}>
                <Skeleton variant="text" width={40} height={32} sx={{ mx: 'auto', mb: 0.5 }} />
                <Skeleton variant="text" width={80} height={12} sx={{ mx: 'auto' }} />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

// Complete gamification display skeleton
export function GamificationDisplaySkeleton() {
  const theme = useTheme();
  
  return (
    <Box>
      {/* Header skeleton */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon sx={{ color: theme.palette.primary.main }} />
          <Skeleton variant="text" width={150} height={28} />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="text" width={100} height={16} />
          <Skeleton variant="circular" width={40} height={40} />
        </Box>
      </Box>

      {/* Progress indicators skeleton */}
      <Box sx={{ mb: 4 }}>
        <ProgressIndicatorsSkeleton />
      </Box>

      {/* Main content skeleton */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <XPProgressSkeleton />
        </Grid>
        <Grid item xs={12} lg={6}>
          <BadgeCollectionSkeleton />
        </Grid>
      </Grid>

      {/* Activity summary skeleton */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[...Array(4)].map((_, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton variant="text" width={40} height={32} sx={{ mx: 'auto', mb: 0.5 }} />
                  <Skeleton variant="text" width={80} height={12} sx={{ mx: 'auto' }} />
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

// Skeleton for list items
export function ListItemSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Box>
      {[...Array(count)].map((_, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="50%" height={14} />
          </Box>
          <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
    </Box>
  );
}

// Skeleton for data tables
export function TableSkeleton({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number; 
  columns?: number; 
}) {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
        {[...Array(columns)].map((_, index) => (
          <Skeleton key={index} variant="text" width={100} height={20} />
        ))}
      </Box>
      
      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: 'flex', gap: 2, py: 1 }}>
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width={100} height={16} />
          ))}
        </Box>
      ))}
    </Box>
  );
}

export default {
  LoadingSpinner,
  LoadingOverlay,
  ProgressLoader,
  XPProgressSkeleton,
  BadgeCollectionSkeleton,
  ProgressIndicatorsSkeleton,
  GamificationDisplaySkeleton,
  ListItemSkeleton,
  TableSkeleton,
};
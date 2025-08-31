'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Grid,
  Paper,
  useTheme,
} from '@mui/material';

/**
 * Skeleton loader for individual review cards
 */
export function ReviewCardSkeleton() {
  const theme = useTheme();

  return (
    <Card
      sx={{
        mb: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header with app name and platform */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
          <Skeleton variant="text" width={120} height={20} sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }} />
          <Skeleton variant="rectangular" width={60} height={16} sx={{ borderRadius: 1 }} />
        </Box>

        {/* Rating stars */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {[...Array(5)].map((_, index) => (
            <Skeleton
              key={index}
              variant="circular"
              width={16}
              height={16}
              sx={{ mr: 0.5 }}
            />
          ))}
          <Skeleton variant="text" width={80} height={16} sx={{ ml: 1 }} />
        </Box>

        {/* Review content */}
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width="100%" height={20} />
          <Skeleton variant="text" width="85%" height={20} />
          <Skeleton variant="text" width="60%" height={20} />
        </Box>

        {/* Footer with indicators */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="circular" width={8} height={8} sx={{ mr: 1 }} />
            <Skeleton variant="text" width={60} height={16} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="circular" width={16} height={16} sx={{ mr: 1 }} />
            <Skeleton variant="circular" width={16} height={16} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for the review overview section
 */
export function ReviewOverviewSkeleton() {
  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      {/* Title */}
      <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
      
      <Grid container spacing={3}>
        {/* Sentiment breakdown */}
        <Grid item xs={12} md={4}>
          <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Skeleton variant="circular" width={12} height={12} sx={{ mr: 1 }} />
            <Skeleton variant="text" width={80} height={16} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="circular" width={12} height={12} sx={{ mr: 1 }} />
            <Skeleton variant="text" width={80} height={16} />
          </Box>
        </Grid>

        {/* Platform breakdown */}
        <Grid item xs={12} md={4}>
          <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} />
          {[...Array(3)].map((_, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Skeleton variant="circular" width={16} height={16} sx={{ mr: 1 }} />
              <Skeleton variant="text" width={100} height={16} />
            </Box>
          ))}
        </Grid>

        {/* Quest breakdown */}
        <Grid item xs={12} md={4}>
          <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} />
          {[...Array(3)].map((_, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Skeleton variant="circular" width={16} height={16} sx={{ mr: 1 }} />
              <Skeleton variant="text" width={90} height={16} />
            </Box>
          ))}
        </Grid>
      </Grid>
    </Paper>
  );
}

/**
 * Skeleton loader for the review filters section
 */
export function ReviewFiltersSkeleton() {
  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3}>
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
        </Grid>
      </Grid>
    </Paper>
  );
}

/**
 * Skeleton loader for multiple review cards
 */
interface ReviewListSkeletonProps {
  count?: number;
}

export function ReviewListSkeleton({ count = 5 }: ReviewListSkeletonProps) {
  return (
    <Box>
      {[...Array(count)].map((_, index) => (
        <ReviewCardSkeleton key={index} />
      ))}
    </Box>
  );
}

/**
 * Skeleton loader for the entire feed tab
 */
export function FeedTabSkeleton() {
  return (
    <Box>
      {/* Header skeleton */}
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={150} height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={250} height={20} />
      </Box>

      {/* Overview skeleton */}
      <ReviewOverviewSkeleton />

      {/* Filters skeleton */}
      <ReviewFiltersSkeleton />

      {/* Reviews list skeleton */}
      <ReviewListSkeleton count={3} />
    </Box>
  );
}

/**
 * Compact skeleton for loading more reviews
 */
export function LoadMoreSkeleton() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
      <Skeleton variant="rectangular" width={150} height={36} sx={{ borderRadius: 1 }} />
    </Box>
  );
}

/**
 * Skeleton for pagination loading
 */
export function PaginationSkeleton() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
      <Skeleton variant="circular" width={24} height={24} sx={{ mr: 2 }} />
      <Skeleton variant="text" width={120} height={20} />
    </Box>
  );
}

export default {
  ReviewCardSkeleton,
  ReviewOverviewSkeleton,
  ReviewFiltersSkeleton,
  ReviewListSkeleton,
  FeedTabSkeleton,
  LoadMoreSkeleton,
  PaginationSkeleton,
};
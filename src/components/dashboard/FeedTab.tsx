"use client";

import React, { useState, useCallback } from 'react';
import {
    Box,
    Typography,
    Grid,
    Button,
    CircularProgress,
    Alert,
    Paper,
    useTheme,
} from '@mui/material';
import { User } from '@/lib/models/client/user';
import { Review } from '@/lib/models/client/review';
import { useReviews, ReviewFilters as ReviewFiltersType } from '@/lib/hooks/useReviews';
import { useAuth } from '@/lib/hooks/useAuth';
import ReviewOverview from './ReviewOverview';
import ReviewFilters from './ReviewFilters';
import ReviewCard from './ReviewCard';
import { Platform } from './types';

export default function FeedTab({ user }: { user: User | null }) {
    const theme = useTheme();
    const { isAuthenticated } = useAuth();
    
    // State for filters
    const [filters, setFilters] = useState<ReviewFiltersType>({});
    
    // Use the reviews hook for data fetching
    const {
        reviews,
        loading,
        error,
        hasMore,
        totalCount,
        overview,
        loadMore,
        refresh,
        setFilters: updateFilters,
        clearError
    } = useReviews(filters);

    // Handle filter changes
    const handleFiltersChange = useCallback((newFilters: ReviewFiltersType) => {
        setFilters(newFilters);
        updateFilters(newFilters);
    }, [updateFilters]);

    // Handle load more button click
    const handleLoadMore = useCallback(() => {
        loadMore();
    }, [loadMore]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        refresh();
    }, [refresh]);

    // Show setup message if user hasn't configured apps
    if (!user?.apps || user.apps.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" gutterBottom>
                    Welcome to Review Alert!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Add your app store links in the Command Center to start monitoring reviews.
                </Typography>
                <Paper 
                    elevation={1} 
                    sx={{ 
                        p: 3, 
                        maxWidth: 400, 
                        mx: 'auto',
                        backgroundColor: theme.palette.grey[50]
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Once configured, you&apos;ll see all your app reviews here in real-time.
                    </Typography>
                </Paper>
            </Box>
        );
    }

    // Show authentication required message
    if (!isAuthenticated) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" gutterBottom>
                    Authentication Required
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Please sign in to view your reviews.
                </Typography>
            </Box>
        );
    }

    // Helper function to get app name and platform for a review
    const getAppInfoForReview = (review: Review): { appName: string; platform: Platform } => {
        // Try to find the app from user's apps based on appId
        const userApp = user?.apps?.find(app => app._id === review.appId || app.appId === review.appId);
        
        if (userApp) {
            return {
                appName: `App (${userApp.store})`, // Since we don't have app names in the current model
                platform: userApp.store as Platform
            };
        }
        
        // Fallback if app not found - try to extract from URL or use default
        return {
            appName: 'Unknown App',
            platform: 'ChromeExt'
        };
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Review Feed
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Monitor feedback from your {user.apps.length} tracked app{user.apps.length > 1 ? 's' : ''}
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 3 }}
                    onClose={clearError}
                    action={
                        <Button color="inherit" size="small" onClick={handleRefresh}>
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {/* Overview Section */}
            {overview && (
                <ReviewOverview
                    totalReviews={totalCount}
                    sentimentBreakdown={overview.sentimentBreakdown}
                    platformBreakdown={overview.platformBreakdown}
                    questBreakdown={overview.questBreakdown}
                />
            )}

            {/* Filters Section */}
            <ReviewFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
            />

            {/* Loading State for Initial Load */}
            {loading && reviews.length === 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Reviews List */}
            {reviews.length > 0 && (
                <Grid container spacing={2}>
                    {reviews.map((review) => {
                        const { appName, platform } = getAppInfoForReview(review);
                        return (
                            <Grid item xs={12} key={review._id}>
                                <ReviewCard
                                    review={review}
                                    appName={appName}
                                    platform={platform}
                                />
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Load More Button */}
            {hasMore && reviews.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={handleLoadMore}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Loading...' : 'Load More Reviews'}
                    </Button>
                </Box>
            )}

            {/* Empty States */}
            {!loading && reviews.length === 0 && !error && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" gutterBottom color="text.secondary">
                        {Object.keys(filters).some(key => filters[key as keyof ReviewFiltersType]) 
                            ? 'No reviews match your filters' 
                            : 'No reviews yet'
                        }
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {Object.keys(filters).some(key => filters[key as keyof ReviewFiltersType])
                            ? 'Try adjusting your filters to see more reviews.'
                            : 'We&apos;ll notify you when new reviews come in!'
                        }
                    </Typography>
                    {Object.keys(filters).some(key => filters[key as keyof ReviewFiltersType]) && (
                        <Button variant="outlined" onClick={() => handleFiltersChange({})}>
                            Clear All Filters
                        </Button>
                    )}
                </Box>
            )}

            {/* End of List Indicator */}
            {!hasMore && reviews.length > 0 && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        You&apos;ve reached the end of your reviews
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
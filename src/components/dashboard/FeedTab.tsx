"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { RefreshRounded, ErrorOutlineRounded } from '@mui/icons-material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { User } from '@/lib/models/client/user';
import { Review } from '@/lib/models/client/review';
import { useReviews, ReviewFilters as ReviewFiltersType } from '@/lib/hooks/useReviews';
import { useAuth } from '@/lib/hooks/useAuth';
import ErrorBoundary from '@/components/ErrorBoundary';
import { 
    FeedTabSkeleton, 
    ReviewListSkeleton, 
    PaginationSkeleton,
    ReviewOverviewSkeleton,
    ReviewFiltersSkeleton 
} from '@/components/SkeletonLoaders';
import ReviewOverview from './ReviewOverview';
import ReviewFilters from './ReviewFilters';
import ReviewCard from './ReviewCard';
import VirtualizedReviewList from './VirtualizedReviewList';
import { Platform } from './types';
import { usePerformanceMonitor } from '@/lib/utils/performanceMonitor';

const VIRTUAL_SCROLL_THRESHOLD = 50; // Use virtual scrolling when more than 50 reviews

interface FeedTabProps {
    user: User | null;
    highlightedReviewId?: string | null;
    onQuestCountChange?: () => void;
}

export default function FeedTab({ user, highlightedReviewId, onQuestCountChange }: FeedTabProps) {
    const theme = useTheme();
    const { isAuthenticated } = useAuth();
    const { startRender, endRender } = usePerformanceMonitor('FeedTab');
    
    // State for filters
    const [filters, setFilters] = useState<ReviewFiltersType>({});
    
    // Use the reviews hook for data fetching
    const {
        reviews,
        loading,
        initialLoading,
        loadingMore,
        error,
        hasError,
        retryCount,
        hasMore,
        totalCount,
        overview,
        loadMore,
        refresh,
        setFilters: updateFilters,
        clearError,
        retry
    } = useReviews(filters);

    // Memoize app lookup map for better performance
    const appLookupMap = useMemo(() => {
        const map = new Map<string, { appName: string; platform: Platform }>();
        user?.apps?.forEach(app => {
            map.set(app._id, {
                appName: `App (${app.store})`, // Since we don't have app names in the current model
                platform: app.store as Platform
            });
            // Also map by appId if different from _id
            if (app.appId && app.appId !== app._id) {
                map.set(app.appId, {
                    appName: `App (${app.store})`,
                    platform: app.store as Platform
                });
            }
        });
        return map;
    }, [user?.apps]);

    // Helper function to get app name and platform for a review
    const getAppInfoForReview = useCallback((review: Review): { appName: string; platform: Platform } => {
        const appInfo = appLookupMap.get(review.appId);
        return appInfo || {
            appName: 'Unknown App',
            platform: 'ChromeExt'
        };
    }, [appLookupMap]);

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

    // Performance monitoring
    useEffect(() => {
        startRender();
        return () => {
            endRender();
        };
    });

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

    return (
        <ErrorBoundary>
            <Box>
                {/* Toast Container for notifications */}
                <ToastContainer />

                {/* Show full skeleton on initial load */}
                {initialLoading && reviews.length === 0 ? (
                    <FeedTabSkeleton />
                ) : (
                    <>
                        {/* Header */}
                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Review Feed
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Monitor feedback from your {user.apps.length} tracked app{user.apps.length > 1 ? 's' : ''}
                                        {retryCount > 0 && (
                                            <Typography component="span" variant="body2" color="warning.main" sx={{ ml: 1 }}>
                                                (Retry attempt {retryCount})
                                            </Typography>
                                        )}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<RefreshRounded />}
                                    onClick={handleRefresh}
                                    disabled={loading}
                                >
                                    Refresh
                                </Button>
                            </Box>
                        </Box>

                        {/* Error Alert with Enhanced Actions */}
                        {hasError && error && (
                            <Alert 
                                severity="error" 
                                sx={{ mb: 3 }}
                                onClose={clearError}
                                icon={<ErrorOutlineRounded />}
                                action={
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button color="inherit" size="small" onClick={retry}>
                                            Retry
                                        </Button>
                                        <Button color="inherit" size="small" onClick={handleRefresh}>
                                            Refresh
                                        </Button>
                                    </Box>
                                }
                            >
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                        Failed to load reviews
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.8 }}>
                                        {error}
                                    </Typography>
                                </Box>
                            </Alert>
                        )}

                        {/* Overview Section with Skeleton */}
                        {initialLoading && !overview ? (
                            <ReviewOverviewSkeleton />
                        ) : overview ? (
                            <ReviewOverview
                                totalReviews={totalCount}
                                sentimentBreakdown={overview.sentimentBreakdown}
                                platformBreakdown={overview.platformBreakdown}
                                questBreakdown={overview.questBreakdown}
                            />
                        ) : null}

                        {/* Main Content Area with Responsive Layout */}
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'column', lg: 'row' },
                            gap: 3,
                            alignItems: 'flex-start'
                        }}>
                            {/* Filters Sidebar - Left side on desktop, top on mobile */}
                            <Box sx={{ 
                                width: { xs: '100%', lg: '320px' },
                                flexShrink: 0,
                                position: { lg: 'sticky' },
                                top: { lg: 24 },
                                alignSelf: { lg: 'flex-start' }
                            }}>
                                {initialLoading ? (
                                    <ReviewFiltersSkeleton />
                                ) : (
                                    <ReviewFilters
                                        filters={filters}
                                        onFiltersChange={handleFiltersChange}
                                    />
                                )}
                            </Box>

                            {/* Reviews Content Area */}
                            <Box sx={{ 
                                flex: 1,
                                minWidth: 0, // Prevents flex item from overflowing
                                maxWidth: { lg: 'calc(100% - 344px)' } // Account for sidebar width + gap
                            }}>
                                {/* Reviews List - Use virtual scrolling for large lists */}
                                {reviews.length > 0 && (
                                    reviews.length > VIRTUAL_SCROLL_THRESHOLD ? (
                                        <VirtualizedReviewList
                                            reviews={reviews}
                                            getAppInfoForReview={getAppInfoForReview}
                                            highlightedReviewId={highlightedReviewId}
                                            onQuestCreated={(questId) => {
                                                console.log('Quest created:', questId);
                                            }}
                                            height={600}
                                            itemHeight={200}
                                        />
                                    ) : (
                                        <Grid container spacing={2}>
                                            {reviews.map((review) => {
                                                const { appName, platform } = getAppInfoForReview(review);
                                                return (
                                                    <Grid item xs={12} key={review._id}>
                                                        <ReviewCard
                                                            review={review}
                                                            appName={appName}
                                                            platform={platform}
                                                            highlighted={highlightedReviewId === review._id}
                                                            onQuestCreated={(questId) => {
                                                                // Optionally refresh reviews to show updated questId
                                                                // or update the review in the local state
                                                                console.log('Quest created:', questId, 'for review:', review._id);
                                                                // Notify dashboard to update quest counts
                                                                onQuestCountChange?.();
                                                            }}
                                                        />
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    )
                                )}

                                {/* Loading More Skeleton */}
                                {loadingMore && (
                                    <ReviewListSkeleton count={2} />
                                )}

                                {/* Load More Button */}
                                {hasMore && reviews.length > 0 && !loadingMore && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                        <Button
                                            variant="outlined"
                                            onClick={handleLoadMore}
                                            disabled={loading}
                                            startIcon={loading ? <CircularProgress size={20} /> : null}
                                        >
                                            Load More Reviews
                                        </Button>
                                    </Box>
                                )}

                                {/* Pagination Loading Indicator */}
                                {loadingMore && (
                                    <PaginationSkeleton />
                                )}

                                {/* Enhanced Empty States */}
                                {!initialLoading && !loading && reviews.length === 0 && !hasError && (
                                    <Paper 
                                        elevation={0} 
                                        sx={{ 
                                            textAlign: 'center', 
                                            py: 8, 
                                            backgroundColor: theme.palette.grey[50],
                                            border: `1px dashed ${theme.palette.grey[300]}`,
                                            borderRadius: 2
                                        }}
                                    >
                                        <Typography variant="h6" gutterBottom color="text.secondary">
                                            {Object.keys(filters).some(key => filters[key as keyof ReviewFiltersType]) 
                                                ? 'No reviews match your filters' 
                                                : 'No reviews yet'
                                            }
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                                            {Object.keys(filters).some(key => filters[key as keyof ReviewFiltersType])
                                                ? 'Try adjusting your filters to see more reviews, or check back later for new feedback.'
                                                : 'Once your apps start receiving reviews, they\'ll appear here. We\'ll notify you when new reviews come in!'
                                            }
                                        </Typography>
                                        {Object.keys(filters).some(key => filters[key as keyof ReviewFiltersType]) ? (
                                            <Button 
                                                variant="contained" 
                                                onClick={() => handleFiltersChange({})}
                                                sx={{ mr: 1 }}
                                            >
                                                Clear All Filters
                                            </Button>
                                        ) : (
                                            <Button 
                                                variant="outlined" 
                                                onClick={handleRefresh}
                                                startIcon={<RefreshRounded />}
                                            >
                                                Check for Reviews
                                            </Button>
                                        )}
                                    </Paper>
                                )}

                                {/* End of List Indicator */}
                                {!hasMore && reviews.length > 0 && !loadingMore && (
                                    <Box sx={{ textAlign: 'center', py: 3 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            You&apos;ve reached the end of your reviews ({totalCount} total)
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>


                    </>
                )}
            </Box>
        </ErrorBoundary>
    );
}
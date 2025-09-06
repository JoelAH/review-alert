"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Alert,
    Skeleton,
    Grid,
    Divider,
    IconButton,
    Tooltip,
    useTheme,
    useMediaQuery,
    alpha,
    Fade,
    CircularProgress,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    EmojiEvents as TrophyIcon,
    Error as ErrorIcon,
    Wifi as OnlineIcon,
    WifiOff as OfflineIcon,
} from '@mui/icons-material';
import XPProgress from './XPProgress';
import BadgeCollection from './BadgeCollection';
import ProgressIndicators from './ProgressIndicators';
import ErrorBoundary from '../common/ErrorBoundary';
import { 
  GamificationDisplaySkeleton, 
  LoadingOverlay, 
  LoadingSpinner 
} from '../common/LoadingStates';
import { 
  NetworkStatusIndicator, 
  ErrorWithRetry, 
  useNetworkStatus, 
  useRetry 
} from '../common/NetworkStatus';
import { GamificationData, BadgeProgress, Badge, XPTransaction } from '@/types/gamification';

export interface GamificationDisplayProps {
    userId?: string;
    initialData?: GamificationData;
    onRefresh?: () => void;
    onError?: (error: Error) => void;
    onLevelUp?: (newLevel: number) => void;
    onBadgeEarned?: (badge: Badge) => void;
}

interface GamificationApiResponse {
    gamificationData: GamificationData;
    badgeProgress: BadgeProgress[];
    xpForNextLevel: number;
    levelThresholds: number[];
}

// Loading skeleton component
function GamificationSkeleton() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Box>
            {/* Header Skeleton */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Skeleton variant="text" width={200} height={32} />
                <Skeleton variant="circular" width={40} height={40} />
            </Box>

            <Grid container spacing={3}>
                {/* XP Progress Skeleton */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Skeleton variant="text" width={120} height={24} />
                                <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                            </Box>
                            <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
                            <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: 4, mb: 2 }} />
                            <Skeleton variant="text" width={150} height={20} />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Badge Collection Skeleton */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Skeleton variant="text" width={150} height={24} />
                                <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: 1 }} />
                            </Box>
                            <Grid container spacing={2}>
                                {[...Array(isMobile ? 2 : 4)].map((_, index) => (
                                    <Grid item xs={6} sm={3} key={index}>
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
                </Grid>
            </Grid>
        </Box>
    );
}

// Error display component
interface ErrorDisplayProps {
    error: Error;
    onRetry: () => void;
    isRetrying: boolean;
}

function ErrorDisplay({ error, onRetry, isRetrying }: ErrorDisplayProps) {
    const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
    const isAuthError = error.message.includes('Unauthorized') || error.message.includes('401');

    return (
        <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <ErrorIcon sx={{ fontSize: '3rem', color: 'error.main', mb: 2 }} />
                <Typography variant="h6" color="error" sx={{ mb: 1 }}>
                    {isAuthError ? 'Authentication Error' : 'Failed to Load Gamification Data'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                    {isAuthError 
                        ? 'Please sign in again to view your progress.'
                        : isNetworkError 
                        ? 'Check your internet connection and try again.'
                        : 'Something went wrong while loading your XP and badges.'}
                </Typography>
                {!isAuthError && (
                    <Button
                        variant="contained"
                        onClick={onRetry}
                        disabled={isRetrying}
                        startIcon={isRetrying ? <CircularProgress size={16} /> : <RefreshIcon />}
                    >
                        {isRetrying ? 'Retrying...' : 'Try Again'}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// Network status indicator
function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <Alert 
            severity="warning" 
            icon={<OfflineIcon />}
            sx={{ mb: 2 }}
        >
            You&apos;re offline. Some features may not work properly.
        </Alert>
    );
}

export default function GamificationDisplay({
    userId,
    initialData,
    onRefresh,
    onError,
    onLevelUp,
    onBadgeEarned
}: GamificationDisplayProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    // Network status
    const { isOnline } = useNetworkStatus();
    const { retry, retryCount, isRetrying, canRetry, reset: resetRetry } = useRetry(3, 1000);
    
    // State management
    const [gamificationData, setGamificationData] = useState<GamificationData | null>(initialData || null);
    const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
    const [xpForNextLevel, setXpForNextLevel] = useState<number>(0);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState<Error | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
    const [previousLevel, setPreviousLevel] = useState<number | null>(null);
    const [hasInitialLoadFailed, setHasInitialLoadFailed] = useState(false);

    // Fetch gamification data from API with enhanced error handling
    const fetchGamificationData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);
            resetRetry(); // Reset retry state on new fetch

            // Check network connectivity
            if (!isOnline) {
                throw new Error('No internet connection. Please check your network and try again.');
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch('/api/gamification', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                
                // Enhance error messages based on status codes
                let enhancedMessage = errorMessage;
                if (response.status === 401) {
                    enhancedMessage = 'Authentication required. Please sign in again.';
                } else if (response.status === 403) {
                    enhancedMessage = 'Access denied. You don\'t have permission to view this data.';
                } else if (response.status === 404) {
                    enhancedMessage = 'Gamification data not found. This might be your first visit.';
                } else if (response.status >= 500) {
                    enhancedMessage = 'Server error. Our team has been notified. Please try again later.';
                } else if (response.status === 429) {
                    enhancedMessage = 'Too many requests. Please wait a moment before trying again.';
                }
                
                throw new Error(enhancedMessage);
            }

            const data: GamificationApiResponse = await response.json();
            
            // Validate response data
            if (!data.gamificationData) {
                throw new Error('Invalid response: missing gamification data');
            }
            
            // Convert date strings back to Date objects
            const processedData: GamificationData = {
                ...data.gamificationData,
                streaks: {
                    ...data.gamificationData.streaks,
                    lastLoginDate: data.gamificationData.streaks.lastLoginDate 
                        ? new Date(data.gamificationData.streaks.lastLoginDate)
                        : undefined,
                },
                badges: data.gamificationData.badges.map(badge => ({
                    ...badge,
                    earnedAt: new Date(badge.earnedAt),
                })),
                xpHistory: data.gamificationData.xpHistory.map(transaction => ({
                    ...transaction,
                    timestamp: new Date(transaction.timestamp),
                })),
            };

            // Check for level up
            if (previousLevel !== null && processedData.level > previousLevel) {
                setShowLevelUpAnimation(true);
                onLevelUp?.(processedData.level);
            }

            // Check for new badges
            if (gamificationData) {
                const previousBadgeIds = new Set(gamificationData.badges.map(b => b.id));
                const newBadges = processedData.badges.filter(badge => !previousBadgeIds.has(badge.id));
                newBadges.forEach(badge => onBadgeEarned?.(badge));
            }

            setGamificationData(processedData);
            setBadgeProgress(data.badgeProgress || []);
            setXpForNextLevel(data.xpForNextLevel || 0);
            setLastUpdated(new Date());
            setPreviousLevel(processedData.level);
            setHasInitialLoadFailed(false);

        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error occurred');
            
            // Handle specific error types
            if (err instanceof Error && err.name === 'AbortError') {
                error.message = 'Request timed out. Please check your connection and try again.';
            }
            
            setError(error);
            
            // Mark initial load as failed if this is not a refresh
            if (!isRefresh && !gamificationData) {
                setHasInitialLoadFailed(true);
            }
            
            onError?.(error);
            console.error('Error fetching gamification data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [gamificationData, previousLevel, onLevelUp, onBadgeEarned, onError, isOnline, resetRetry]);

    // Initial data fetch
    useEffect(() => {
        if (!initialData) {
            fetchGamificationData();
        } else {
            setPreviousLevel(initialData.level);
        }
    }, [fetchGamificationData, initialData]);

    // Handle refresh with retry logic
    const handleRefresh = useCallback(async () => {
        try {
            await retry(() => fetchGamificationData(true));
            onRefresh?.();
        } catch (error) {
            // Error is already handled in fetchGamificationData
            console.error('Refresh failed after retries:', error);
        }
    }, [fetchGamificationData, onRefresh, retry]);

    // Handle retry for failed operations
    const handleRetry = useCallback(async () => {
        try {
            await retry(() => fetchGamificationData(false));
        } catch (error) {
            console.error('Retry failed:', error);
        }
    }, [fetchGamificationData, retry]);

    // Handle level up animation completion
    const handleLevelUpAnimationComplete = useCallback(() => {
        setShowLevelUpAnimation(false);
    }, []);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading && !refreshing) {
                fetchGamificationData(true);
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [fetchGamificationData, loading, refreshing]);

    // Loading state with skeleton
    if (loading && !gamificationData) {
        return (
            <ErrorBoundary 
                context="Gamification Display" 
                retryable={true}
                showErrorDetails={process.env.NODE_ENV === 'development'}
            >
                <Box>
                    <NetworkStatusIndicator onRetry={handleRetry} />
                    <GamificationDisplaySkeleton />
                </Box>
            </ErrorBoundary>
        );
    }

    // Error state with retry mechanism
    if (error && !gamificationData && hasInitialLoadFailed) {
        return (
            <ErrorBoundary 
                context="Gamification Display" 
                retryable={true}
                showErrorDetails={process.env.NODE_ENV === 'development'}
            >
                <Box>
                    <NetworkStatusIndicator onRetry={handleRetry} />
                    <ErrorWithRetry
                        error={error}
                        onRetry={handleRetry}
                        maxRetries={3}
                        autoRetry={isOnline}
                        title="Failed to load gamification data"
                        showErrorDetails={process.env.NODE_ENV === 'development'}
                    />
                </Box>
            </ErrorBoundary>
        );
    }

    // No data state with better UX
    if (!gamificationData) {
        return (
            <ErrorBoundary 
                context="Gamification Display" 
                retryable={true}
                showErrorDetails={process.env.NODE_ENV === 'development'}
            >
                <Box>
                    <NetworkStatusIndicator onRetry={handleRetry} />
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <TrophyIcon sx={{ fontSize: '3rem', color: 'action.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                Welcome to ReviewQuest!
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Start completing quests and tracking apps to earn XP and unlock badges.
                            </Typography>
                            <LoadingOverlay loading={isRetrying}>
                                <Button 
                                    variant="contained" 
                                    onClick={handleRetry} 
                                    startIcon={<RefreshIcon />}
                                    disabled={isRetrying}
                                >
                                    {isRetrying ? 'Loading...' : 'Get Started'}
                                </Button>
                            </LoadingOverlay>
                        </CardContent>
                    </Card>
                </Box>
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary 
            context="Gamification Display" 
            retryable={true}
            showErrorDetails={process.env.NODE_ENV === 'development'}
            onError={(error, errorInfo) => {
                console.error('Gamification Display Error:', error, errorInfo);
                onError?.(error);
            }}
        >
            <Box>
                <NetworkStatusIndicator onRetry={handleRetry} />
                
                {/* Header */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    mb: 3,
                    flexWrap: 'wrap',
                    gap: 2
                }}>
                    {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            Your Progress
                        </Typography>
                    </Box> */}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Updated {lastUpdated.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                            })}
                        </Typography>
                        <Tooltip title="Refresh data">
                            <IconButton
                                size="small"
                                onClick={handleRefresh}
                                disabled={refreshing || isRetrying}
                                sx={{
                                    animation: (refreshing || isRetrying) ? 'spin 1s linear infinite' : 'none',
                                    '@keyframes spin': {
                                        '0%': { transform: 'rotate(0deg)' },
                                        '100%': { transform: 'rotate(360deg)' },
                                    },
                                }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Error Alert for refresh failures */}
                {error && gamificationData && (
                    <Fade in={true}>
                        <ErrorWithRetry
                            error={error}
                            onRetry={handleRetry}
                            maxRetries={3}
                            title="Failed to refresh data"
                            showErrorDetails={false}
                        />
                    </Fade>
                )}

                {/* Main content with loading overlay */}
                <LoadingOverlay loading={refreshing} message="Refreshing data...">
                    {/* Progress Indicators Section */}
                    <ErrorBoundary 
                        context="Progress Indicators" 
                        fallback={
                            <Alert severity="warning" sx={{ mb: 4 }}>
                                Progress indicators are temporarily unavailable.
                            </Alert>
                        }
                    >
                        <Box sx={{ mb: 4 }}>
                            <ProgressIndicators
                                gamificationData={gamificationData}
                                onActionClick={(suggestion) => {
                                    // Handle suggestion action clicks
                                    console.log('Suggestion action clicked:', suggestion);
                                    // You can add navigation or other actions here
                                }}
                                showMotivationalMessages={true}
                                maxSuggestions={3}
                            />
                        </Box>
                    </ErrorBoundary>

                    {/* Main Content */}
                    <Grid container spacing={3}>
                        {/* XP Progress Section */}
                        <Grid item xs={12} lg={6}>
                            <ErrorBoundary 
                                context="XP Progress" 
                                fallback={
                                    <Card>
                                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography color="text.secondary">
                                                XP progress temporarily unavailable
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                }
                            >
                                <XPProgress
                                    currentXP={gamificationData.xp}
                                    currentLevel={gamificationData.level}
                                    xpForNextLevel={xpForNextLevel}
                                    recentTransactions={gamificationData.xpHistory.slice(0, 10)}
                                    showLevelUpAnimation={showLevelUpAnimation}
                                    onAnimationComplete={handleLevelUpAnimationComplete}
                                />
                            </ErrorBoundary>
                        </Grid>

                        {/* Badge Collection Section */}
                        <Grid item xs={12} lg={6}>
                            <ErrorBoundary 
                                context="Badge Collection" 
                                fallback={
                                    <Card>
                                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography color="text.secondary">
                                                Badge collection temporarily unavailable
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                }
                            >
                                <BadgeCollection
                                    badges={gamificationData.badges}
                                    badgeProgress={badgeProgress}
                                    onBadgeClick={(badge) => {
                                        // Optional: Add analytics tracking for badge clicks
                                        console.log('Badge clicked:', badge);
                                    }}
                                />
                            </ErrorBoundary>
                        </Grid>
                    </Grid>

                    {/* Quick Stats Section */}
                    <ErrorBoundary 
                        context="Activity Summary" 
                        fallback={
                            <Alert severity="info" sx={{ mt: 3 }}>
                                Activity summary temporarily unavailable
                            </Alert>
                        }
                    >
                        <Card sx={{ mt: 3 }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                    Activity Summary
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6} sm={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                                                {gamificationData.activityCounts.questsCompleted}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Quests Completed
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="secondary" sx={{ fontWeight: 600 }}>
                                                {gamificationData.activityCounts.appsAdded}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Apps Added
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                                                {gamificationData.streaks.currentLoginStreak}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Current Streak
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                                                {gamificationData.badges.length}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Badges Earned
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </ErrorBoundary>
                </LoadingOverlay>
            </Box>
        </ErrorBoundary>
    );
}
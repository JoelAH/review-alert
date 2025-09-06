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

    // Fetch gamification data from API
    const fetchGamificationData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await fetch('/api/gamification', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data: GamificationApiResponse = await response.json();
            
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
            setBadgeProgress(data.badgeProgress);
            setXpForNextLevel(data.xpForNextLevel);
            setLastUpdated(new Date());
            setPreviousLevel(processedData.level);

        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error occurred');
            setError(error);
            onError?.(error);
            console.error('Error fetching gamification data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [gamificationData, previousLevel, onLevelUp, onBadgeEarned, onError]);

    // Initial data fetch
    useEffect(() => {
        if (!initialData) {
            fetchGamificationData();
        } else {
            setPreviousLevel(initialData.level);
        }
    }, [fetchGamificationData, initialData]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        fetchGamificationData(true);
        onRefresh?.();
    }, [fetchGamificationData, onRefresh]);

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

    // Loading state
    if (loading && !gamificationData) {
        return <GamificationSkeleton />;
    }

    // Error state
    if (error && !gamificationData) {
        return (
            <Box>
                <NetworkStatus />
                <ErrorDisplay 
                    error={error} 
                    onRetry={() => fetchGamificationData()} 
                    isRetrying={loading}
                />
            </Box>
        );
    }

    // No data state
    if (!gamificationData) {
        return (
            <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <TrophyIcon sx={{ fontSize: '3rem', color: 'action.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        No Gamification Data
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Start using ReviewQuest to earn XP and badges!
                    </Typography>
                    <Button variant="contained" onClick={handleRefresh} startIcon={<RefreshIcon />}>
                        Check Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Box>
            <NetworkStatus />
            
            {/* Header */}
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
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Your Progress
                    </Typography>
                </Box>
                
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
                            disabled={refreshing}
                            sx={{
                                animation: refreshing ? 'spin 1s linear infinite' : 'none',
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

            {/* Error Alert */}
            {error && gamificationData && (
                <Fade in={true}>
                    <Alert 
                        severity="warning" 
                        sx={{ mb: 2 }}
                        action={
                            <Button 
                                color="inherit" 
                                size="small" 
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                Retry
                            </Button>
                        }
                    >
                        Failed to refresh data. Showing cached information.
                    </Alert>
                </Fade>
            )}

            {/* Main Content */}
            <Grid container spacing={3}>
                {/* XP Progress Section */}
                <Grid item xs={12} lg={6}>
                    <XPProgress
                        currentXP={gamificationData.xp}
                        currentLevel={gamificationData.level}
                        xpForNextLevel={xpForNextLevel}
                        recentTransactions={gamificationData.xpHistory.slice(0, 10)}
                        showLevelUpAnimation={showLevelUpAnimation}
                        onAnimationComplete={handleLevelUpAnimationComplete}
                    />
                </Grid>

                {/* Badge Collection Section */}
                <Grid item xs={12} lg={6}>
                    <BadgeCollection
                        badges={gamificationData.badges}
                        badgeProgress={badgeProgress}
                        onBadgeClick={(badge) => {
                            // Optional: Add analytics tracking for badge clicks
                            console.log('Badge clicked:', badge);
                        }}
                    />
                </Grid>
            </Grid>

            {/* Quick Stats Section */}
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
        </Box>
    );
}
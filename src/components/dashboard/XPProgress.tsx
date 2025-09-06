"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    LinearProgress,
    Card,
    CardContent,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Collapse,
    IconButton,
    useTheme,
    alpha,
    Fade,
    Zoom,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Star as StarIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    EmojiEvents as TrophyIcon,
    LocalFireDepartment as FireIcon,
    Assignment as QuestIcon,
    Apps as AppsIcon,
    RateReview as ReviewIcon,
} from '@mui/icons-material';
import { XPTransaction, XPAction } from '@/types/gamification';

export interface XPProgressProps {
    currentXP: number;
    currentLevel: number;
    xpForNextLevel: number;
    recentTransactions: XPTransaction[];
    showLevelUpAnimation?: boolean;
    onAnimationComplete?: () => void;
}

// Helper function to get action icon
const getActionIcon = (action: XPAction) => {
    switch (action) {
        case XPAction.QUEST_CREATED:
        case XPAction.QUEST_IN_PROGRESS:
        case XPAction.QUEST_COMPLETED:
            return <QuestIcon fontSize="small" />;
        case XPAction.APP_ADDED:
            return <AppsIcon fontSize="small" />;
        case XPAction.REVIEW_INTERACTION:
            return <ReviewIcon fontSize="small" />;
        case XPAction.LOGIN_STREAK_BONUS:
            return <FireIcon fontSize="small" />;
        default:
            return <StarIcon fontSize="small" />;
    }
};

// Helper function to get action description
const getActionDescription = (action: XPAction, metadata?: Record<string, any>) => {
    switch (action) {
        case XPAction.QUEST_CREATED:
            return 'Created a new quest';
        case XPAction.QUEST_IN_PROGRESS:
            return 'Started working on a quest';
        case XPAction.QUEST_COMPLETED:
            return 'Completed a quest';
        case XPAction.APP_ADDED:
            return 'Added a new app to track';
        case XPAction.REVIEW_INTERACTION:
            return 'Interacted with a review';
        case XPAction.LOGIN_STREAK_BONUS:
            const streakDays = metadata?.streakDays || 0;
            return `Login streak bonus (${streakDays} days)`;
        default:
            return 'Earned XP';
    }
};

// Helper function to format date
const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) {
            return 'Yesterday';
        } else if (diffInDays < 7) {
            return `${diffInDays}d ago`;
        } else {
            return dateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    }
};

export default function XPProgress({ 
    currentXP, 
    currentLevel, 
    xpForNextLevel, 
    recentTransactions,
    showLevelUpAnimation = false,
    onAnimationComplete
}: XPProgressProps) {
    const theme = useTheme();
    const [showTransactions, setShowTransactions] = useState(false);
    const [animationVisible, setAnimationVisible] = useState(false);

    // Calculate progress percentage for current level
    const getLevelThresholds = () => {
        // These should match the XP service thresholds
        return [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000];
    };

    const levelThresholds = getLevelThresholds();
    const currentLevelXP = levelThresholds[currentLevel - 1] || 0;
    const nextLevelXP = levelThresholds[currentLevel] || levelThresholds[levelThresholds.length - 1];
    const progressInLevel = currentXP - currentLevelXP;
    const xpNeededForLevel = nextLevelXP - currentLevelXP;
    const progressPercentage = xpNeededForLevel > 0 ? (progressInLevel / xpNeededForLevel) * 100 : 100;

    // Handle level up animation
    useEffect(() => {
        if (showLevelUpAnimation) {
            setAnimationVisible(true);
            const timer = setTimeout(() => {
                setAnimationVisible(false);
                onAnimationComplete?.();
            }, 3000); // Animation duration
            return () => clearTimeout(timer);
        } else {
            setAnimationVisible(false);
        }
    }, [showLevelUpAnimation, onAnimationComplete]);

    const toggleTransactions = () => {
        setShowTransactions(!showTransactions);
    };

    // Sort transactions by timestamp (most recent first)
    const sortedTransactions = [...recentTransactions]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10); // Show only last 10 transactions

    const isMaxLevel = currentLevel >= levelThresholds.length;

    return (
        <Box>
            {/* Level Up Animation */}
            {showLevelUpAnimation && (
                <Fade in={animationVisible} timeout={500}>
                    <Box
                        sx={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: alpha(theme.palette.primary.main, 0.9),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            flexDirection: 'column',
                            gap: 2,
                        }}
                    >
                        <Zoom in={animationVisible} timeout={800}>
                            <TrophyIcon 
                                sx={{ 
                                    fontSize: '4rem', 
                                    color: theme.palette.warning.main,
                                    filter: 'drop-shadow(0 0 20px rgba(255, 193, 7, 0.5))'
                                }} 
                            />
                        </Zoom>
                        <Typography 
                            variant="h3" 
                            sx={{ 
                                color: 'white', 
                                fontWeight: 'bold',
                                textAlign: 'center',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                        >
                            Level Up!
                        </Typography>
                        <Typography 
                            variant="h5" 
                            sx={{ 
                                color: 'white',
                                textAlign: 'center',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                        >
                            You reached Level {currentLevel}!
                        </Typography>
                    </Box>
                </Fade>
            )}

            {/* Main XP Progress Card */}
            <Card elevation={2}>
                <CardContent>
                    {/* Header with level and XP */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrophyIcon sx={{ color: theme.palette.warning.main }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Level {currentLevel}
                            </Typography>
                        </Box>
                        <Chip
                            icon={<TrendingUpIcon />}
                            label={`${currentXP.toLocaleString()} XP`}
                            color="primary"
                            variant="outlined"
                        />
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Progress to Level {currentLevel + 1}
                            </Typography>
                            {!isMaxLevel && (
                                <Typography variant="body2" color="text.secondary">
                                    {xpForNextLevel.toLocaleString()} XP to go
                                </Typography>
                            )}
                        </Box>
                        
                        {isMaxLevel ? (
                            <Box sx={{ 
                                p: 2, 
                                textAlign: 'center',
                                backgroundColor: alpha(theme.palette.success.main, 0.1),
                                borderRadius: 1,
                                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`
                            }}>
                                <StarIcon sx={{ color: theme.palette.success.main, mb: 1 }} />
                                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                                    Maximum Level Reached!
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    You&apos;ve mastered ReviewQuest
                                </Typography>
                            </Box>
                        ) : (
                            <LinearProgress
                                variant="determinate"
                                value={progressPercentage}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 4,
                                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    },
                                }}
                            />
                        )}
                    </Box>

                    {/* Recent Activity Toggle */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Recent Activity
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={toggleTransactions}
                            aria-label={showTransactions ? "Hide recent activity" : "Show recent activity"}
                        >
                            {showTransactions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>

                    {/* Recent Transactions */}
                    <Collapse in={showTransactions}>
                        <Box sx={{ mt: 1 }}>
                            {sortedTransactions.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No recent activity
                                </Typography>
                            ) : (
                                <List dense sx={{ py: 0 }}>
                                    {sortedTransactions.map((transaction, index) => (
                                        <ListItem
                                            key={`${transaction.timestamp}-${index}`}
                                            sx={{
                                                px: 0,
                                                py: 0.5,
                                                borderRadius: 1,
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                                },
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <Box sx={{ 
                                                    color: theme.palette.primary.main,
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}>
                                                    {getActionIcon(transaction.action)}
                                                </Box>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body2">
                                                            {getActionDescription(transaction.action, transaction.metadata)}
                                                        </Typography>
                                                        <Chip
                                                            label={`+${transaction.amount} XP`}
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                            sx={{ 
                                                                height: 20,
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </Box>
                                                }
                                                secondary={formatDate(transaction.timestamp)}
                                                secondaryTypographyProps={{
                                                    variant: 'caption',
                                                    color: 'text.secondary'
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                    </Collapse>
                </CardContent>
            </Card>
        </Box>
    );
}
"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    useTheme,
    alpha,
    Tooltip,
    Badge as MuiBadge,
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    Star as StarIcon,
    Close as CloseIcon,
    Lock as LockIcon,
    TrendingUp as TrendingUpIcon,
    LocalFireDepartment as FireIcon,
    Assignment as QuestIcon,
    Apps as AppsIcon,
    Collections as CollectionIcon,
} from '@mui/icons-material';
import { Badge, BadgeProgress, BadgeCategory } from '@/types/gamification';

export interface BadgeCollectionProps {
    badges: Badge[];
    badgeProgress: BadgeProgress[];
    onBadgeClick?: (badge: Badge | BadgeProgress) => void;
}

// Helper function to get category icon
const getCategoryIcon = (category: BadgeCategory) => {
    switch (category) {
        case BadgeCategory.MILESTONE:
            return <TrophyIcon />;
        case BadgeCategory.ACHIEVEMENT:
            return <StarIcon />;
        case BadgeCategory.STREAK:
            return <FireIcon />;
        case BadgeCategory.COLLECTION:
            return <CollectionIcon />;
        default:
            return <StarIcon />;
    }
};

// Helper function to get category color
const getCategoryColor = (category: BadgeCategory, theme: any) => {
    switch (category) {
        case BadgeCategory.MILESTONE:
            return theme.palette.warning.main;
        case BadgeCategory.ACHIEVEMENT:
            return theme.palette.success.main;
        case BadgeCategory.STREAK:
            return theme.palette.error.main;
        case BadgeCategory.COLLECTION:
            return theme.palette.info.main;
        default:
            return theme.palette.primary.main;
    }
};

// Helper function to format category name
const formatCategoryName = (category: BadgeCategory) => {
    return category.charAt(0) + category.slice(1).toLowerCase();
};

// Badge card component
interface BadgeCardProps {
    badge: Badge | BadgeProgress;
    isEarned: boolean;
    onClick?: () => void;
}

function BadgeCard({ badge, isEarned, onClick }: BadgeCardProps) {
    const theme = useTheme();
    const badgeData = 'badge' in badge ? badge.badge : badge;
    const progress = 'progress' in badge ? badge : null;
    
    const categoryColor = getCategoryColor(badgeData.category, theme);
    const progressPercentage = progress ? (progress.progress / progress.target) * 100 : 100;
    const isCloseToEarning = progress && progressPercentage >= 75 && !isEarned;

    return (
        <Card
            sx={{
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease-in-out',
                position: 'relative',
                overflow: 'visible',
                '&:hover': onClick ? {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                } : {},
                opacity: isEarned ? 1 : 0.7,
                border: isEarned ? `2px solid ${alpha(categoryColor, 0.3)}` : `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                backgroundColor: isEarned 
                    ? alpha(categoryColor, 0.05) 
                    : alpha(theme.palette.action.disabled, 0.05),
            }}
            onClick={onClick}
        >
            {/* Close to earning indicator */}
            {isCloseToEarning && (
                <MuiBadge
                    badgeContent="!"
                    color="warning"
                    sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        zIndex: 1,
                        '& .MuiBadge-badge': {
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                        }
                    }}
                />
            )}

            <CardContent sx={{ textAlign: 'center', p: 2 }}>
                {/* Badge Icon */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 1,
                        position: 'relative',
                    }}
                >
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isEarned 
                                ? alpha(categoryColor, 0.2) 
                                : alpha(theme.palette.action.disabled, 0.1),
                            color: isEarned ? categoryColor : theme.palette.action.disabled,
                            fontSize: '1.5rem',
                        }}
                    >
                        {isEarned ? getCategoryIcon(badgeData.category) : <LockIcon />}
                    </Box>
                </Box>

                {/* Badge Name */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight: 600,
                        mb: 0.5,
                        color: isEarned ? 'text.primary' : 'text.secondary',
                        minHeight: '2.5em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {badgeData.name}
                </Typography>

                {/* Category Chip */}
                <Chip
                    label={formatCategoryName(badgeData.category)}
                    size="small"
                    sx={{
                        fontSize: '0.7rem',
                        height: 20,
                        backgroundColor: isEarned 
                            ? alpha(categoryColor, 0.1) 
                            : alpha(theme.palette.action.disabled, 0.1),
                        color: isEarned ? categoryColor : theme.palette.text.disabled,
                        border: `1px solid ${isEarned ? alpha(categoryColor, 0.3) : alpha(theme.palette.action.disabled, 0.3)}`,
                        mb: 1,
                    }}
                />

                {/* Progress Bar for Unearned Badges */}
                {!isEarned && progress && (
                    <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                                Progress
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {progress.progress}/{progress.target}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={progressPercentage}
                            sx={{
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: alpha(theme.palette.action.disabled, 0.1),
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 2,
                                    backgroundColor: isCloseToEarning ? theme.palette.warning.main : categoryColor,
                                },
                            }}
                        />
                    </Box>
                )}

                {/* Earned Date */}
                {isEarned && 'earnedAt' in badge && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Earned {new Date(badge.earnedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

// Badge detail modal component
interface BadgeDetailModalProps {
    badge: Badge | BadgeProgress | null;
    isEarned: boolean;
    open: boolean;
    onClose: () => void;
    badgeProgressMap?: Map<string, BadgeProgress>;
}

function BadgeDetailModal({ badge, isEarned, open, onClose, badgeProgressMap }: BadgeDetailModalProps) {
    const theme = useTheme();
    
    if (!badge) return null;
    
    const badgeData = 'badge' in badge ? badge.badge : badge;
    const progress = 'progress' in badge ? badge : null;
    const categoryColor = getCategoryColor(badgeData.category, theme);
    const progressPercentage = progress ? (progress.progress / progress.target) * 100 : 100;
    
    // Get requirements from badge definition or progress badge
    const badgeId = 'badge' in badge ? badge.badge.id : badge.id;
    const badgeProgress = badgeProgressMap?.get(badgeId);
    const requirements = 'requirements' in badgeData && badgeData?.requirements ? badgeData.requirements : (badgeProgress?.badge.requirements || []);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    border: isEarned ? `2px solid ${alpha(categoryColor, 0.3)}` : undefined,
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                pb: 1,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isEarned 
                                ? alpha(categoryColor, 0.2) 
                                : alpha(theme.palette.action.disabled, 0.1),
                            color: isEarned ? categoryColor : theme.palette.action.disabled,
                        }}
                    >
                        {isEarned ? getCategoryIcon(badgeData.category) : <LockIcon />}
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {badgeData.name}
                        </Typography>
                        <Chip
                            label={formatCategoryName(badgeData.category)}
                            size="small"
                            sx={{
                                fontSize: '0.7rem',
                                height: 18,
                                backgroundColor: alpha(categoryColor, 0.1),
                                color: categoryColor,
                            }}
                        />
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
                {/* Description */}
                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                    {badgeData.description}
                </Typography>

                {/* Requirements */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Requirements
                    </Typography>
                    {requirements.length > 0 ? requirements.map((requirement, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                {requirement.type === 'xp' && `Reach ${requirement.value.toLocaleString()} XP`}
                                {requirement.type === 'activity_count' && requirement.field && 
                                    `Complete ${requirement.value} ${requirement.field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                                {requirement.type === 'streak' && `Maintain a ${requirement.value}-day login streak`}
                            </Typography>
                        </Box>
                    )) : (
                        <Typography variant="body2" color="text.secondary">
                            No specific requirements listed
                        </Typography>
                    )}
                </Box>

                {/* Progress for Unearned Badges */}
                {!isEarned && progress && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Your Progress
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                {progress.progress.toLocaleString()} / {progress.target.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {Math.round(progressPercentage)}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={progressPercentage}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: alpha(theme.palette.action.disabled, 0.1),
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 4,
                                    backgroundColor: categoryColor,
                                },
                            }}
                        />
                        {progressPercentage >= 75 && (
                            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block', fontWeight: 600 }}>
                                You&apos;re close to earning this badge!
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Earned Date */}
                {isEarned && 'earnedAt' in badge && (
                    <Box sx={{ 
                        p: 2, 
                        backgroundColor: alpha(categoryColor, 0.1),
                        borderRadius: 1,
                        border: `1px solid ${alpha(categoryColor, 0.3)}`,
                        textAlign: 'center'
                    }}>
                        <TrophyIcon sx={{ color: categoryColor, mb: 1 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: categoryColor }}>
                            Badge Earned!
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {new Date(badge.earnedAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default function BadgeCollection({ badges, badgeProgress, onBadgeClick }: BadgeCollectionProps) {
    const theme = useTheme();
    const [selectedBadge, setSelectedBadge] = useState<Badge | BadgeProgress | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Create a map of earned badges for quick lookup
    const earnedBadgeIds = new Set(badges.map(badge => badge.id));

    // Create a map of badge progress for requirements lookup
    const badgeProgressMap = new Map(badgeProgress.map(progress => [progress.badge.id, progress]));

    // Combine earned badges and progress for display
    const allBadges = badgeProgress.map(progress => {
        const earnedBadge = badges.find(badge => badge.id === progress.badge.id);
        return earnedBadge || progress;
    });

    // Sort badges: earned first, then by progress percentage
    const sortedBadges = allBadges.sort((a, b) => {
        const aEarned = earnedBadgeIds.has('badge' in a ? a.badge.id : a.id);
        const bEarned = earnedBadgeIds.has('badge' in b ? b.badge.id : b.id);
        
        if (aEarned && !bEarned) return -1;
        if (!aEarned && bEarned) return 1;
        
        if (!aEarned && !bEarned) {
            const aProgress = 'progress' in a ? (a.progress / a.target) * 100 : 0;
            const bProgress = 'progress' in b ? (b.progress / b.target) * 100 : 0;
            return bProgress - aProgress;
        }
        
        return 0;
    });

    const handleBadgeClick = (badge: Badge | BadgeProgress) => {
        setSelectedBadge(badge);
        setModalOpen(true);
        onBadgeClick?.(badge);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedBadge(null);
    };

    const earnedCount = badges.length;
    const totalCount = badgeProgress.length;
    const closeToEarningCount = badgeProgress.filter(
        progress => !progress.earned && (progress.progress / progress.target) >= 0.75
    ).length;

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrophyIcon sx={{ color: theme.palette.warning.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Badge Collection
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                        icon={<StarIcon />}
                        label={`${earnedCount}/${totalCount} Earned`}
                        color="primary"
                        variant="outlined"
                        size="small"
                    />
                    {closeToEarningCount > 0 && (
                        <Tooltip title="Badges you're close to earning">
                            <Chip
                                icon={<TrendingUpIcon />}
                                label={`${closeToEarningCount} Close`}
                                color="warning"
                                variant="outlined"
                                size="small"
                            />
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* Badge Grid */}
            {sortedBadges.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <TrophyIcon sx={{ fontSize: '3rem', color: theme.palette.action.disabled, mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                            No badges available
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Start completing activities to earn your first badge!
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={2}>
                    {sortedBadges.map((badge) => {
                        const badgeId = 'badge' in badge ? badge.badge.id : badge.id;
                        const isEarned = earnedBadgeIds.has(badgeId);
                        
                        return (
                            <Grid item xs={6} sm={4} md={3} key={badgeId}>
                                <BadgeCard
                                    badge={badge}
                                    isEarned={isEarned}
                                    onClick={() => handleBadgeClick(badge)}
                                />
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Badge Detail Modal */}
            <BadgeDetailModal
                badge={selectedBadge}
                isEarned={selectedBadge ? earnedBadgeIds.has('badge' in selectedBadge ? selectedBadge.badge.id : selectedBadge.id) : false}
                open={modalOpen}
                onClose={handleModalClose}
                badgeProgressMap={badgeProgressMap}
            />
        </Box>
    );
}
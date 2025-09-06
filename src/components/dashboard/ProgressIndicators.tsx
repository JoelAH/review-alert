"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    LinearProgress,
    Chip,
    Button,
    IconButton,
    Collapse,
    Alert,
    Stack,
    Tooltip,
    useTheme,
    alpha,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    EmojiEvents as BadgeIcon,
    Whatshot as StreakIcon,
    Assignment as QuestIcon,
    Apps as AppsIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Lightbulb as SuggestionIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import { ProgressSuggestion, ProgressIndicatorsService } from '@/lib/services/progressIndicators';
import { GamificationData, BadgeCategory } from '@/types/gamification';

export interface ProgressIndicatorsProps {
    gamificationData: GamificationData;
    onActionClick?: (suggestion: ProgressSuggestion) => void;
    showMotivationalMessages?: boolean;
    maxSuggestions?: number;
}

// Icon mapping for different suggestion types
const getSuggestionIcon = (suggestion: ProgressSuggestion) => {
    switch (suggestion.type) {
        case 'badge':
            return <BadgeIcon />;
        case 'level':
            return <TrendingUpIcon />;
        case 'streak':
            return <StreakIcon />;
        case 'activity':
            if (suggestion.id.includes('quest')) return <QuestIcon />;
            if (suggestion.id.includes('app')) return <AppsIcon />;
            return <SuggestionIcon />;
        default:
            return <SuggestionIcon />;
    }
};

// Color mapping for priority levels
const getPriorityColor = (priority: ProgressSuggestion['priority'], theme: any) => {
    switch (priority) {
        case 'high':
            return theme.palette.error.main;
        case 'medium':
            return theme.palette.warning.main;
        case 'low':
            return theme.palette.info.main;
        default:
            return theme.palette.grey[500];
    }
};

// Progress suggestion card component
interface SuggestionCardProps {
    suggestion: ProgressSuggestion;
    onActionClick?: (suggestion: ProgressSuggestion) => void;
}

function SuggestionCard({ suggestion, onActionClick }: SuggestionCardProps) {
    const theme = useTheme();
    const progressPercentage = (suggestion.progress / suggestion.target) * 100;
    const priorityColor = getPriorityColor(suggestion.priority, theme);

    return (
        <Card 
            variant="outlined" 
            sx={{ 
                position: 'relative',
                '&:hover': {
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out',
                },
                border: `1px solid ${alpha(priorityColor, 0.3)}`,
            }}
        >
            <CardContent sx={{ pb: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Box sx={{ color: priorityColor }}>
                            {getSuggestionIcon(suggestion)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                {suggestion.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {suggestion.description}
                            </Typography>
                        </Box>
                    </Box>
                    <Chip 
                        label={suggestion.priority} 
                        size="small" 
                        sx={{ 
                            backgroundColor: alpha(priorityColor, 0.1),
                            color: priorityColor,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                        }}
                    />
                </Box>

                {/* Progress Bar */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Progress
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {suggestion.progress} / {suggestion.target}
                        </Typography>
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={Math.min(progressPercentage, 100)}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(priorityColor, 0.1),
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: priorityColor,
                                borderRadius: 3,
                            },
                        }}
                    />
                </Box>

                {/* Motivational Message */}
                {suggestion.motivationalMessage && (
                    <Alert 
                        severity="info" 
                        icon={<StarIcon />}
                        sx={{ 
                            mb: 2, 
                            backgroundColor: alpha(theme.palette.info.main, 0.05),
                            '& .MuiAlert-icon': {
                                color: theme.palette.info.main,
                            },
                        }}
                    >
                        <Typography variant="body2">
                            {suggestion.motivationalMessage}
                        </Typography>
                    </Alert>
                )}

                {/* Action Button */}
                {/* <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    onClick={() => onActionClick?.(suggestion)}
                    sx={{
                        backgroundColor: priorityColor,
                        '&:hover': {
                            backgroundColor: alpha(priorityColor, 0.8),
                        },
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    {suggestion.actionText}
                    {suggestion.estimatedActions && (
                        <Chip 
                            label={`${suggestion.estimatedActions}`}
                            size="small"
                            sx={{ 
                                ml: 1, 
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                height: 20,
                                fontSize: '0.7rem',
                            }}
                        />
                    )}
                </Button> */}
            </CardContent>
        </Card>
    );
}

// Motivational messages component
interface MotivationalMessagesProps {
    messages: string[];
}

function MotivationalMessages({ messages }: MotivationalMessagesProps) {
    const [expanded, setExpanded] = useState(false);
    
    if (messages.length === 0) return null;

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StarIcon color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Keep Going!
                        </Typography>
                    </Box>
                    {messages.length > 1 && (
                        <IconButton 
                            size="small" 
                            onClick={() => setExpanded(!expanded)}
                            aria-label={expanded ? "Collapse messages" : "Expand messages"}
                        >
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {messages[0]}
                </Typography>
                
                <Collapse in={expanded}>
                    <Stack spacing={1} sx={{ mt: 2 }}>
                        {messages.slice(1).map((message, index) => (
                            <Typography key={index} variant="body2" color="text.secondary">
                                • {message}
                            </Typography>
                        ))}
                    </Stack>
                </Collapse>
            </CardContent>
        </Card>
    );
}

export default function ProgressIndicators({
    gamificationData,
    onActionClick,
    showMotivationalMessages = true,
    maxSuggestions = 5
}: ProgressIndicatorsProps) {
    const theme = useTheme();
    const [showAllSuggestions, setShowAllSuggestions] = useState(false);

    // Get progress suggestions
    const allSuggestions = ProgressIndicatorsService.getProgressSuggestions(gamificationData);
    const smartSuggestions = ProgressIndicatorsService.getSmartSuggestions(gamificationData);
    const motivationalMessages = showMotivationalMessages 
        ? ProgressIndicatorsService.getMotivationalMessages(gamificationData)
        : [];

    // Combine and deduplicate suggestions
    const combinedSuggestions = [...allSuggestions, ...smartSuggestions]
        .filter((suggestion, index, array) => 
            array.findIndex(s => s.id === suggestion.id) === index
        )
        .slice(0, maxSuggestions * 2); // Allow more for show all functionality

    const displayedSuggestions = showAllSuggestions 
        ? combinedSuggestions 
        : combinedSuggestions.slice(0, maxSuggestions);

    // If no suggestions, show encouraging message
    if (combinedSuggestions.length === 0) {
        return (
            <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <StarIcon sx={{ fontSize: '3rem', color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                        You're doing great!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Keep up the excellent work. Continue completing quests and tracking apps to earn more XP and badges.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Box>
            {/* Motivational Messages */}
            {showMotivationalMessages && (
                <MotivationalMessages messages={motivationalMessages} />
            )}

            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SuggestionIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Progress & Suggestions
                    </Typography>
                    <Chip 
                        label={`${combinedSuggestions.length} suggestion${combinedSuggestions.length === 1 ? '' : 's'}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Box>
                
                {combinedSuggestions.length > maxSuggestions && (
                    <Button
                        size="small"
                        onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                        endIcon={showAllSuggestions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                        {showAllSuggestions ? 'Show Less' : 'Show All'}
                    </Button>
                )}
            </Box>

            {/* Suggestions Grid */}
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                },
                gap: 2,
            }}>
                {displayedSuggestions.map((suggestion) => (
                    <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onActionClick={onActionClick}
                    />
                ))}
            </Box>

            {/* Summary Stats */}
            {combinedSuggestions.length > 0 && (
                <Card sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                            Quick Stats
                        </Typography>
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                            gap: 2 
                        }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="error.main" sx={{ fontWeight: 600 }}>
                                    {combinedSuggestions.filter(s => s.priority === 'high').length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    High Priority
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                                    {combinedSuggestions.filter(s => s.priority === 'medium').length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Medium Priority
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                                    {combinedSuggestions.filter(s => s.type === 'badge').length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Badge Progress
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                                    {Math.round(combinedSuggestions.reduce((sum, s) => sum + (s.progress / s.target), 0) / combinedSuggestions.length * 100)}%
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Avg Progress
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
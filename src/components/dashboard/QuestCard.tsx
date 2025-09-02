"use client";

import React from 'react';
import {
    Card,
    CardContent,
    Box,
    Typography,
    Chip,
    IconButton,
    useTheme,
    alpha,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Quest, QuestType, QuestPriority, QuestState } from '@/lib/models/client/quest';
import QuestStateSelector from './QuestStateSelector';

export interface QuestCardProps {
    quest: Quest;
    onStateChange: (questId: string, newState: QuestState) => Promise<void>;
    onEdit: (quest: Quest) => void;
}

// Helper function to get state color
const getStateColor = (state: QuestState, theme: any) => {
    switch (state) {
        case QuestState.OPEN:
            return theme.palette.info.main; // Blue
        case QuestState.IN_PROGRESS:
            return theme.palette.warning.main; // Orange
        case QuestState.DONE:
            return theme.palette.success.main; // Green
        default:
            return theme.palette.grey[500];
    }
};

// Helper function to get priority color and label
const getPriorityConfig = (priority: QuestPriority) => {
    switch (priority) {
        case QuestPriority.HIGH:
            return { color: 'error', label: 'High Priority' };
        case QuestPriority.MEDIUM:
            return { color: 'warning', label: 'Medium Priority' };
        case QuestPriority.LOW:
            return { color: 'success', label: 'Low Priority' };
        default:
            return { color: 'default', label: 'Unknown Priority' };
    }
};

// Helper function to get quest type label
const getQuestTypeLabel = (type: QuestType) => {
    switch (type) {
        case QuestType.BUG_FIX:
            return 'Bug Fix';
        case QuestType.FEATURE_REQUEST:
            return 'Feature Request';
        case QuestType.IMPROVEMENT:
            return 'Improvement';
        case QuestType.RESEARCH:
            return 'Research';
        case QuestType.OTHER:
            return 'Other';
        default:
            return 'Unknown';
    }
};

// Helper function to format date
const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Unknown';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export default function QuestCard({ quest, onStateChange, onEdit }: QuestCardProps) {
    const theme = useTheme();
    const stateColor = getStateColor(quest.state, theme);
    const priorityConfig = getPriorityConfig(quest.priority);

    const handleEditClick = () => {
        onEdit(quest);
    };

    return (
        <Card
            elevation={1}
            sx={{
                height: '100%',
                borderLeft: `4px solid ${stateColor}`,
                '&:hover': {
                    elevation: 2,
                    transform: 'translateY(-1px)',
                    transition: 'all 0.2s ease-in-out',
                },
                backgroundColor: quest.state === QuestState.DONE 
                    ? alpha(theme.palette.success.main, 0.05)
                    : 'background.paper'
            }}
        >
            <CardContent>
                {/* Header with priority and edit button */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Chip
                        label={priorityConfig.label}
                        size="small"
                        color={priorityConfig.color as any}
                        variant="outlined"
                    />
                    <IconButton
                        size="small"
                        onClick={handleEditClick}
                        sx={{ ml: 1 }}
                        aria-label="Edit quest"
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Quest title */}
                <Typography 
                    variant="subtitle1" 
                    sx={{ 
                        fontWeight: 600, 
                        mb: 1,
                        textDecoration: quest.state === QuestState.DONE ? 'line-through' : 'none',
                        opacity: quest.state === QuestState.DONE ? 0.7 : 1
                    }}
                >
                    {quest.title}
                </Typography>

                {/* Quest details */}
                {quest.details && (
                    <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                            mb: 2,
                            opacity: quest.state === QuestState.DONE ? 0.7 : 1
                        }}
                    >
                        {quest.details}
                    </Typography>
                )}

                {/* Quest type and state selector */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Chip
                        label={getQuestTypeLabel(quest.type)}
                        size="small"
                        variant="filled"
                        sx={{ 
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main
                        }}
                    />
                    <QuestStateSelector
                        questId={quest._id}
                        currentState={quest.state}
                        onStateChange={onStateChange}
                        size="small"
                    />
                </Box>

                {/* Creation date */}
                <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                        display: 'block',
                        opacity: quest.state === QuestState.DONE ? 0.7 : 1
                    }}
                >
                    Created: {formatDate(quest.createdAt)}
                </Typography>
            </CardContent>
        </Card>
    );
}
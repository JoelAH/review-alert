"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Grid,
    CircularProgress,
    Alert,
    Button,
    useTheme,
    Paper,
    Skeleton,
} from '@mui/material';
import { User } from '@/lib/models/client/user';
import { Quest, QuestState } from '@/lib/models/client/quest';
import { QuestService, QuestError } from '@/lib/services/quests';
import QuestCard from './QuestCard';
import QuestModal from './QuestModal';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export interface QuestsTabProps {
    user: User | null;
    onViewReview?: (reviewId: string) => void;
    onQuestCountChange?: () => void;
}

// Helper function to sort quests by state then priority
const sortQuests = (quests: Quest[]): Quest[] => {
    const stateOrder = {
        [QuestState.OPEN]: 0,
        [QuestState.IN_PROGRESS]: 1,
        [QuestState.DONE]: 2,
    };

    const priorityOrder = {
        HIGH: 0,
        MEDIUM: 1,
        LOW: 2,
    };

    return [...quests].sort((a, b) => {
        // First sort by state
        const stateComparison = stateOrder[a.state] - stateOrder[b.state];
        if (stateComparison !== 0) {
            return stateComparison;
        }

        // Then sort by priority
        const priorityComparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityComparison !== 0) {
            return priorityComparison;
        }

        // Finally sort by creation date (newest first)
        const aDate = new Date(a.createdAt || 0).getTime();
        const bDate = new Date(b.createdAt || 0).getTime();
        return bDate - aDate;
    });
};

export default function QuestsTab({ user, onViewReview, onQuestCountChange }: QuestsTabProps) {
    const theme = useTheme();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Load quests on component mount
    const loadQuests = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const response = await QuestService.fetchQuests();
            const sortedQuests = sortQuests(response.quests);
            setQuests(sortedQuests);
        } catch (err) {
            const questError = QuestError.fromError(err);
            setError(questError?.message || 'An unexpected error occurred');
            console.error('Failed to load quests:', questError);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadQuests();
    }, [loadQuests]);

    // Handle quest state changes
    const handleStateChange = useCallback(async (questId: string, newState: QuestState) => {
        try {
            const updatedQuest = await QuestService.updateQuest(questId, { state: newState });
            
            // Update the quest in the local state
            setQuests(prevQuests => {
                const updatedQuests = prevQuests.map(quest =>
                    quest._id === questId ? updatedQuest : quest
                );
                return sortQuests(updatedQuests);
            });

            // Notify dashboard to update quest counts
            onQuestCountChange?.();
        } catch (err) {
            const questError = QuestError.fromError(err);
            console.error('Failed to update quest state:', questError);
            // The QuestStateSelector component will handle showing the error to the user
            throw questError || new Error('Failed to update quest state');
        }
    }, [onQuestCountChange]);

    // Handle quest editing
    const handleEdit = useCallback((quest: Quest) => {
        setEditingQuest(quest);
        setIsModalOpen(true);
    }, []);

    // Handle quest update from modal
    const handleQuestUpdate = useCallback(async (questData: any) => {
        if (!editingQuest) return;

        try {
            const updatedQuest = await QuestService.updateQuest(editingQuest._id, questData);
            
            // Update the quest in the local state
            setQuests(prevQuests => {
                const updatedQuests = prevQuests.map(quest =>
                    quest._id === editingQuest._id ? updatedQuest : quest
                );
                return sortQuests(updatedQuests);
            });

            setIsModalOpen(false);
            setEditingQuest(null);

            // Notify dashboard to update quest counts
            onQuestCountChange?.();
        } catch (err) {
            const questError = QuestError.fromError(err);
            console.error('Failed to update quest:', questError);
            throw questError || new Error('Failed to update quest');
        }
    }, [editingQuest, onQuestCountChange]);

    // Handle modal close
    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setEditingQuest(null);
    }, []);

    // Handle retry
    const handleRetry = useCallback(() => {
        setLoading(true);
        loadQuests();
    }, [loadQuests]);

    // Group quests by state for display
    const openQuests = quests.filter(quest => quest.state === QuestState.OPEN);
    const inProgressQuests = quests.filter(quest => quest.state === QuestState.IN_PROGRESS);
    const doneQuests = quests.filter(quest => quest.state === QuestState.DONE);

    // Loading state
    if (loading) {
        return (
            <Box>
                <Box sx={{ mb: 3 }}>
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="text" width={300} height={20} sx={{ mb: 2 }} />
                </Box>
                <Grid container spacing={2}>
                    {[1, 2, 3, 4].map((i) => (
                        <Grid item xs={12} md={6} key={i}>
                            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    // Error state
    if (error) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    Failed to Load Quests
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {error}
                </Typography>
                <Button variant="contained" onClick={handleRetry}>
                    Try Again
                </Button>
            </Box>
        );
    }

    // Empty state
    if (quests.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 6 }}>
                <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    No Quests Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Create your first quest from a review to start tracking actionable tasks.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Visit the Feed tab and click "Create Quest" on any review card.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Quest Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Track and manage actionable tasks created from review feedback
                </Typography>
                
                {/* Quest summary */}
                <Paper 
                    elevation={1} 
                    sx={{ 
                        p: 2, 
                        mb: 3,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <PlaylistAddCheckIcon color="primary" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Quest Overview
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                                {openQuests.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Open
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                {inProgressQuests.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                In Progress
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                {doneQuests.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Done
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Open Quests */}
            {openQuests.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'info.main' }} />
                        Open Quests ({openQuests.length})
                    </Typography>
                    <Grid container spacing={2}>
                        {openQuests.map((quest) => (
                            <Grid item xs={12} md={6} lg={4} key={quest._id}>
                                <QuestCard
                                    quest={quest}
                                    onStateChange={handleStateChange}
                                    onEdit={handleEdit}
                                    onViewReview={onViewReview}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* In Progress Quests */}
            {inProgressQuests.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'warning.main' }} />
                        In Progress ({inProgressQuests.length})
                    </Typography>
                    <Grid container spacing={2}>
                        {inProgressQuests.map((quest) => (
                            <Grid item xs={12} md={6} lg={4} key={quest._id}>
                                <QuestCard
                                    quest={quest}
                                    onStateChange={handleStateChange}
                                    onEdit={handleEdit}
                                    onViewReview={onViewReview}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Done Quests */}
            {doneQuests.length > 0 && (
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'success.main' }} />
                        Completed ({doneQuests.length})
                    </Typography>
                    <Grid container spacing={2}>
                        {doneQuests.map((quest) => (
                            <Grid item xs={12} md={6} lg={4} key={quest._id}>
                                <QuestCard
                                    quest={quest}
                                    onStateChange={handleStateChange}
                                    onEdit={handleEdit}
                                    onViewReview={onViewReview}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Edit Quest Modal */}
            <QuestModal
                open={isModalOpen}
                onClose={handleModalClose}
                onSubmit={handleQuestUpdate}
                initialData={editingQuest ? {
                    title: editingQuest.title,
                    details: editingQuest.details,
                    type: editingQuest.type,
                    priority: editingQuest.priority,
                } : undefined}
                mode="edit"
                quest={editingQuest || undefined}
            />
        </Box>
    );
}
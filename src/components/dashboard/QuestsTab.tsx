"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Typography,
    Grid,
    Button,
    useTheme,
    Paper,
    Skeleton,
    Alert,
    Snackbar,
} from '@mui/material';
import { User } from '@/lib/models/client/user';
import { Quest, QuestState } from '@/lib/models/client/quest';
import { QuestService, QuestError } from '@/lib/services/quests';
import { NotificationService } from '@/lib/services/notifications';
import QuestCard from './QuestCard';
import QuestModal from './QuestModal';
import GamificationDisplay from './GamificationDisplay';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiOffIcon from '@mui/icons-material/WifiOff';

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
    const [error, setError] = useState<QuestError | null>(null);
    const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [gamificationLoading, setGamificationLoading] = useState(false);
    const [gamificationError, setGamificationError] = useState<Error | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Load quests on component mount
    const loadQuests = useCallback(async (showLoadingState = true) => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Cancel any existing request
        // if (abortControllerRef.current) {
        //     abortControllerRef.current.abort();
        // }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        try {
            if (showLoadingState) {
                setLoading(true);
            }
            setError(null);
            setIsOffline(false);

            const response = await QuestService.fetchQuests({
                signal: abortControllerRef.current.signal
            });
            const sortedQuests = sortQuests(response.quests);
            setQuests(sortedQuests);
            setRetryCount(0); // Reset retry count on success
        } catch (err) {
            console.log(err)
            // Don't handle aborted requests
            if (abortControllerRef.current?.signal.aborted) {
                return;
            }

            // Handle different error types
            let questError: QuestError;
            if (err instanceof QuestError) {
                questError = err;
            } else {
                // Create a basic error if QuestError.fromError fails
                try {
                    questError = QuestError.fromError(err);
                } catch {
                    questError = new QuestError(
                        err instanceof Error ? err.message : 'An unexpected error occurred',
                        'UNKNOWN_ERROR'
                    );
                }
            }
            
            setError(questError);
            
            // Check if it's a network error
            if (questError?.isNetworkError) {
                setIsOffline(true);
            }

            console.error('Failed to load quests:', questError);
            
            // Show error notification only if not retrying automatically
            if (!isRetrying) {
                NotificationService.error(QuestService.getErrorMessage(questError));
            }
        } finally {
            setLoading(false);
            setIsRetrying(false);
        }
    }, [user, isRetrying]);

    useEffect(() => {
        loadQuests();
        
        // Cleanup on unmount
        // return () => {
        //     // if (abortControllerRef.current) {
        //     //     abortControllerRef.current.abort();
        //     // }
        // };
    }, [loadQuests]);

    // Auto-retry mechanism for network errors
    useEffect(() => {
        if (error?.isNetworkError && retryCount < 3) {
            const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
            const timeoutId = setTimeout(() => {
                setIsRetrying(true);
                setRetryCount(prev => prev + 1);
                loadQuests(false); // Don't show loading state for auto-retry
            }, retryDelay);

            return () => clearTimeout(timeoutId);
        }
    }, [error, retryCount, loadQuests]);

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

            // Show success notification
            const stateLabels = {
                [QuestState.OPEN]: 'Open',
                [QuestState.IN_PROGRESS]: 'In Progress',
                [QuestState.DONE]: 'Done'
            };
            NotificationService.success(`Quest marked as ${stateLabels[newState].toLowerCase()}`);

            // Notify dashboard to update quest counts
            onQuestCountChange?.();
        } catch (err) {
            const questError = QuestError.fromError(err);
            console.error('Failed to update quest state:', questError);
            
            // Show error notification
            NotificationService.error(QuestService.getErrorMessage(questError));
            
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

            // Show success notification
            NotificationService.success('Quest updated successfully');

            // Notify dashboard to update quest counts
            onQuestCountChange?.();
        } catch (err) {
            const questError = QuestError.fromError(err);
            console.error('Failed to update quest:', questError);
            
            // Show error notification
            NotificationService.error(QuestService.getErrorMessage(questError));
            
            throw questError || new Error('Failed to update quest');
        }
    }, [editingQuest, onQuestCountChange]);

    // Handle modal close
    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setEditingQuest(null);
    }, []);

    // Handle manual retry
    const handleRetry = useCallback(() => {
        setRetryCount(0);
        setIsRetrying(false);
        loadQuests(true);
    }, [loadQuests]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        setRetryCount(0);
        setIsRetrying(false);
        loadQuests(true);
    }, [loadQuests]);

    // Handle gamification refresh
    const handleGamificationRefresh = useCallback(() => {
        // The GamificationDisplay component handles its own refresh
        // This callback can be used for additional logic if needed
    }, []);

    // Handle gamification errors
    const handleGamificationError = useCallback((error: Error) => {
        setGamificationError(error);
        console.error('Gamification error:', error);
    }, []);

    // Handle level up notifications
    const handleLevelUp = useCallback((newLevel: number) => {
        NotificationService.success(`🎉 Level up! You've reached level ${newLevel}!`);
    }, []);

    // Handle badge earned notifications
    const handleBadgeEarned = useCallback((badge: any) => {
        NotificationService.success(`🏆 Badge earned: ${badge.name}!`);
    }, []);

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
    if (error && !loading && quests.length === 0) {
        const isNetworkError = error?.isNetworkError || false;
        const isAuthError = error?.isAuthError || false;
        
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                {isNetworkError ? (
                    <WifiOffIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                ) : (
                    <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                )}
                
                <Typography variant="h6" gutterBottom>
                    {isNetworkError ? 'Connection Problem' : 
                     isAuthError ? 'Authentication Required' : 
                     'Failed to Load Quests'}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                    {QuestService.getErrorMessage(error)}
                </Typography>

                {isRetrying && (
                    <Alert severity="info" sx={{ mb: 2, maxWidth: 400, mx: 'auto' }}>
                        Retrying automatically... (Attempt {retryCount + 1}/3)
                    </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button 
                        variant="contained" 
                        onClick={handleRetry}
                        disabled={isRetrying}
                        startIcon={<RefreshIcon />}
                    >
                        {isRetrying ? 'Retrying...' : 'Try Again'}
                    </Button>
                    
                    {isNetworkError && (
                        <Button 
                            variant="outlined" 
                            onClick={() => window.location.reload()}
                        >
                            Reload Page
                        </Button>
                    )}
                </Box>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Quest Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Track and manage actionable tasks created from review feedback
                        </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isOffline && (
                            <Alert severity="warning" sx={{ py: 0.5, px: 1 }}>
                                <WifiOffIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                Offline
                            </Alert>
                        )}
                        
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleRefresh}
                            disabled={loading || isRetrying}
                            startIcon={<RefreshIcon />}
                            sx={{ minWidth: 'auto' }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Box>
                
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

            {/* Gamification Section - only show when successfully loaded quests */}
            {user && !loading && !error && quests.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'primary.main' }} />
                        Your Progress
                    </Typography>
                    <GamificationDisplay
                        userId={user.uid}
                        initialData={user.gamification}
                        onRefresh={handleGamificationRefresh}
                        onError={handleGamificationError}
                        onLevelUp={handleLevelUp}
                        onBadgeEarned={handleBadgeEarned}
                    />
                </Box>
            )}

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
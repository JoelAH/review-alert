"use client";

import React, { useState, useCallback } from 'react';
import {
    Select,
    MenuItem,
    FormControl,
    Box,
    CircularProgress,
    useTheme,
    alpha,
    SelectChangeEvent,
    Tooltip,
} from '@mui/material';
import { QuestState } from '@/lib/models/client/quest';
import ErrorIcon from '@mui/icons-material/Error';

export interface QuestStateSelectorProps {
    questId: string;
    currentState: QuestState;
    onStateChange: (questId: string, newState: QuestState) => Promise<void>;
    disabled?: boolean;
    size?: 'small' | 'medium';
}

// Helper function to get state display info
const getStateDisplayInfo = (state: QuestState, theme: any) => {
    switch (state) {
        case QuestState.OPEN:
            return {
                label: 'Open',
                color: theme.palette.info.main,
                backgroundColor: alpha(theme.palette.info.main, 0.1),
            };
        case QuestState.IN_PROGRESS:
            return {
                label: 'In Progress',
                color: theme.palette.warning.main,
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
            };
        case QuestState.DONE:
            return {
                label: 'Done',
                color: theme.palette.success.main,
                backgroundColor: alpha(theme.palette.success.main, 0.1),
            };
        default:
            return {
                label: 'Unknown',
                color: theme.palette.grey[500],
                backgroundColor: alpha(theme.palette.grey[500], 0.1),
            };
    }
};

// All available quest states in logical order
const QUEST_STATES = [
    QuestState.OPEN,
    QuestState.IN_PROGRESS,
    QuestState.DONE,
] as const;

export default function QuestStateSelector({
    questId,
    currentState,
    onStateChange,
    disabled = false,
    size = 'small',
}: QuestStateSelectorProps) {
    const theme = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [optimisticState, setOptimisticState] = useState<QuestState | null>(null);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    
    // Use optimistic state if available, otherwise use current state
    const displayState = optimisticState ?? currentState;
    const stateInfo = getStateDisplayInfo(displayState, theme);

    const handleStateChange = useCallback(async (event: SelectChangeEvent<QuestState>) => {
        const newState = event.target.value as QuestState;
        
        // Don't do anything if the state hasn't actually changed
        if (newState === currentState) {
            return;
        }

        // Set optimistic state immediately for responsive UI
        setOptimisticState(newState);
        setIsLoading(true);
        setHasError(false);

        try {
            await onStateChange(questId, newState);
            // Success - clear optimistic state and reset retry count
            setOptimisticState(null);
            setRetryCount(0);
        } catch (error) {
            // Error - rollback optimistic state and show error indicator
            setOptimisticState(null);
            setHasError(true);
            setRetryCount(prev => prev + 1);
            console.error('Failed to update quest state:', error);
            
            // Auto-retry for network errors (up to 2 times)
            if (retryCount < 2) {
                setTimeout(() => {
                    handleStateChange(event);
                }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
            }
        } finally {
            setIsLoading(false);
        }
    }, [questId, currentState, onStateChange, retryCount]);

    const isDisabled = disabled || isLoading;

    return (
        <FormControl size={size} sx={{ minWidth: 120 }}>
            <Select
                value={displayState}
                onChange={handleStateChange}
                disabled={isDisabled}
                displayEmpty
                variant="outlined"
                size={size}
                sx={{
                    backgroundColor: stateInfo.backgroundColor,
                    color: stateInfo.color,
                    fontWeight: 500,
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(stateInfo.color, 0.3),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(stateInfo.color, 0.5),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: stateInfo.color,
                    },
                    '& .MuiSelect-icon': {
                        color: stateInfo.color,
                    },
                    '&.Mui-disabled': {
                        opacity: 0.6,
                    },
                }}
                MenuProps={{
                    PaperProps: {
                        sx: {
                            maxHeight: 200,
                        },
                    },
                }}
                renderValue={(value) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isLoading && (
                            <CircularProgress 
                                size={16} 
                                sx={{ color: stateInfo.color }}
                                aria-label="Updating quest state"
                            />
                        )}
                        {hasError && !isLoading && (
                            <Tooltip title="Failed to update state. Click to retry.">
                                <ErrorIcon 
                                    sx={{ 
                                        fontSize: 16, 
                                        color: 'error.main',
                                        cursor: 'pointer'
                                    }}
                                />
                            </Tooltip>
                        )}
                        <span>{getStateDisplayInfo(value, theme).label}</span>
                    </Box>
                )}
                inputProps={{
                    'aria-label': 'Quest state selector',
                    'aria-describedby': `quest-state-help-${questId}`,
                }}
            >
                {QUEST_STATES.map((state) => {
                    const itemInfo = getStateDisplayInfo(state, theme);
                    return (
                        <MenuItem
                            key={state}
                            value={state}
                            sx={{
                                color: itemInfo.color,
                                '&:hover': {
                                    backgroundColor: itemInfo.backgroundColor,
                                },
                                '&.Mui-selected': {
                                    backgroundColor: itemInfo.backgroundColor,
                                    '&:hover': {
                                        backgroundColor: alpha(itemInfo.color, 0.15),
                                    },
                                },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: itemInfo.color,
                                    }}
                                />
                                {itemInfo.label}
                            </Box>
                        </MenuItem>
                    );
                })}
            </Select>
            
            {/* Hidden helper text for screen readers */}
            <Box
                id={`quest-state-help-${questId}`}
                sx={{ 
                    position: 'absolute',
                    left: -10000,
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
                }}
                aria-live="polite"
                aria-atomic="true"
            >
                {isLoading 
                    ? `Updating quest state to ${getStateDisplayInfo(displayState, theme).label.toLowerCase()}`
                    : `Current quest state: ${stateInfo.label.toLowerCase()}`
                }
            </Box>
        </FormControl>
    );
}
'use client';

import React from 'react';
import {
    Box,
    Typography,
    Paper,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { User } from '@/lib/models/client/user';
import GamificationDisplay from './GamificationDisplay';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export interface ProgressTabProps {
    user: User | null;
}

export default function ProgressTab({ user }: ProgressTabProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    if (!user) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                    Please sign in to view your progress
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TrendingUpIcon color="primary" />
                    <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        component="h2" 
                        sx={{ fontWeight: 600 }}
                    >
                        Your Progress
                    </Typography>
                </Box>
                <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    Track your XP, level progress, badges, and achievements
                </Typography>
            </Box>

            {/* Progress Content */}
            <Paper 
                elevation={1} 
                sx={{ 
                    p: isMobile ? 2 : 3,
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(25, 118, 210, 0.02) 0%, rgba(156, 39, 176, 0.02) 100%)',
                }}
            >
                <GamificationDisplay
                    userId={user.uid}
                    initialData={undefined} // Don't use stale data, always fetch fresh
                    onRefresh={() => {
                        // Handle refresh if needed
                        console.log('Refreshing gamification data...');
                    }}
                    onError={(error) => {
                        console.error('Gamification error:', error);
                    }}
                    onLevelUp={(newLevel) => {
                        console.log('Level up!', newLevel);
                    }}
                    onBadgeEarned={(badge) => {
                        console.log('Badge earned!', badge);
                    }}
                />
            </Paper>

            {/* Additional Progress Info */}
            <Box sx={{ mt: 3 }}>
                <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ textAlign: 'center' }}
                >
                    Complete quests, add apps, and maintain login streaks to earn XP and unlock badges
                </Typography>
            </Box>
        </Box>
    );
}
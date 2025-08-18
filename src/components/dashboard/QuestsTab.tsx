"use client";

import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    LinearProgress,
    Chip,
    Button,
    useTheme,
    Paper,
} from '@mui/material';
import { User } from '@/lib/models/client/user';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Mock quest data
const mockQuests = [
    {
        id: 1,
        title: "Set up your first app",
        description: "Add your first app store link to start monitoring reviews",
        progress: 100,
        completed: true,
        reward: "🎉 Welcome bonus",
        category: "Setup"
    },
    {
        id: 2,
        title: "Configure notifications",
        description: "Set up email notifications to stay informed about new reviews",
        progress: 100,
        completed: true,
        reward: "📧 Never miss a review",
        category: "Setup"
    },
    {
        id: 3,
        title: "Track multiple stores",
        description: "Add apps from at least 2 different app stores",
        progress: 66,
        completed: false,
        reward: "🏆 Multi-platform master",
        category: "Growth"
    },
    {
        id: 4,
        title: "Respond to 5 reviews",
        description: "Engage with your users by responding to their feedback",
        progress: 20,
        completed: false,
        reward: "💬 Community builder",
        category: "Engagement"
    },
    {
        id: 5,
        title: "Maintain 4+ star average",
        description: "Keep your average rating above 4 stars across all apps",
        progress: 85,
        completed: false,
        reward: "⭐ Quality champion",
        category: "Quality"
    }
];

function getCategoryColor(category: string) {
    switch (category) {
        case 'Setup':
            return 'primary';
        case 'Growth':
            return 'secondary';
        case 'Engagement':
            return 'success';
        case 'Quality':
            return 'warning';
        default:
            return 'default';
    }
}

export default function QuestsTab({ }: { user: User | null }) {
    const theme = useTheme();

    const completedQuests = mockQuests.filter(quest => quest.completed);
    const activeQuests = mockQuests.filter(quest => !quest.completed);

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Your Progress
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Complete quests to unlock features and improve your review monitoring
                </Typography>
                
                <Paper 
                    elevation={1} 
                    sx={{ 
                        p: 2, 
                        mb: 3,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <TrendingUpIcon color="primary" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Quest Progress
                        </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {completedQuests.length}/{mockQuests.length}
                    </Typography>
                    <LinearProgress 
                        variant="determinate" 
                        value={(completedQuests.length / mockQuests.length) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Paper>
            </Box>

            {activeQuests.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RadioButtonUncheckedIcon color="action" />
                        Active Quests
                    </Typography>
                    <Grid container spacing={2}>
                        {activeQuests.map((quest) => (
                            <Grid item xs={12} md={6} key={quest.id}>
                                <Card 
                                    elevation={1}
                                    sx={{ 
                                        height: '100%',
                                        '&:hover': {
                                            elevation: 2,
                                            transform: 'translateY(-1px)',
                                            transition: 'all 0.2s ease-in-out',
                                        }
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Chip 
                                                label={quest.category}
                                                size="small"
                                                color={getCategoryColor(quest.category) as any}
                                                variant="outlined"
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                {quest.progress}%
                                            </Typography>
                                        </Box>
                                        
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                            {quest.title}
                                        </Typography>
                                        
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {quest.description}
                                        </Typography>
                                        
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={quest.progress}
                                            sx={{ mb: 2, height: 6, borderRadius: 3 }}
                                        />
                                        
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                                {quest.reward}
                                            </Typography>
                                            {quest.progress > 80 && (
                                                <Button size="small" variant="outlined">
                                                    Complete
                                                </Button>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {completedQuests.length > 0 && (
                <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon color="success" />
                        Completed Quests
                    </Typography>
                    <Grid container spacing={2}>
                        {completedQuests.map((quest) => (
                            <Grid item xs={12} md={6} key={quest.id}>
                                <Card 
                                    elevation={1}
                                    sx={{ 
                                        height: '100%',
                                        opacity: 0.8,
                                        backgroundColor: theme.palette.grey[50]
                                    }}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Chip 
                                                label={quest.category}
                                                size="small"
                                                color={getCategoryColor(quest.category) as any}
                                                variant="filled"
                                            />
                                            <CheckCircleIcon color="success" />
                                        </Box>
                                        
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                            {quest.title}
                                        </Typography>
                                        
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {quest.description}
                                        </Typography>
                                        
                                        <Typography variant="caption" sx={{ fontWeight: 500, color: 'success.main' }}>
                                            ✓ {quest.reward}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
}
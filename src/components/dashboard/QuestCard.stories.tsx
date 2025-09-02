import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Grid } from '@mui/material';
import QuestCard from './QuestCard';
import { Quest, QuestType, QuestPriority, QuestState } from '@/lib/models/client/quest';

const theme = createTheme();

// Mock quest data for different states and priorities
const mockQuests: Quest[] = [
    {
        _id: 'quest-1',
        user: 'user-123',
        reviewId: 'review-456',
        title: 'Fix login authentication bug',
        details: 'Users are unable to login with Google OAuth. The authentication flow is failing at the token exchange step.',
        type: QuestType.BUG_FIX,
        priority: QuestPriority.HIGH,
        state: QuestState.OPEN,
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z')
    },
    {
        _id: 'quest-2',
        user: 'user-123',
        title: 'Add dark mode support',
        details: 'Implement dark mode theme switching functionality across the entire application.',
        type: QuestType.FEATURE_REQUEST,
        priority: QuestPriority.MEDIUM,
        state: QuestState.IN_PROGRESS,
        createdAt: new Date('2024-01-10T14:20:00Z'),
        updatedAt: new Date('2024-01-16T09:15:00Z')
    },
    {
        _id: 'quest-3',
        user: 'user-123',
        title: 'Optimize database queries',
        details: 'Review and optimize slow database queries to improve application performance.',
        type: QuestType.IMPROVEMENT,
        priority: QuestPriority.LOW,
        state: QuestState.DONE,
        createdAt: new Date('2024-01-05T16:45:00Z'),
        updatedAt: new Date('2024-01-12T11:30:00Z')
    },
    {
        _id: 'quest-4',
        user: 'user-123',
        title: 'Research new UI framework',
        type: QuestType.RESEARCH,
        priority: QuestPriority.LOW,
        state: QuestState.OPEN,
        createdAt: new Date('2024-01-18T08:00:00Z'),
        updatedAt: new Date('2024-01-18T08:00:00Z')
    },
    {
        _id: 'quest-5',
        user: 'user-123',
        title: 'Update documentation',
        details: 'Update API documentation to reflect recent changes.',
        type: QuestType.OTHER,
        priority: QuestPriority.MEDIUM,
        state: QuestState.IN_PROGRESS,
        createdAt: new Date('2024-01-12T13:15:00Z'),
        updatedAt: new Date('2024-01-17T10:45:00Z')
    }
];

const mockOnStateChange = (questId: string, newState: QuestState) => {
    console.log(`State change requested for quest ${questId} to ${newState}`);
};

const mockOnEdit = (quest: Quest) => {
    console.log('Edit requested for quest:', quest.title);
};

export default function QuestCardStories() {
    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
                <Box sx={{ mb: 4 }}>
                    <h1>QuestCard Component Examples</h1>
                    <p>This page demonstrates the QuestCard component with different states, priorities, and types.</p>
                </Box>

                <Grid container spacing={3}>
                    {mockQuests.map((quest) => (
                        <Grid item xs={12} md={6} lg={4} key={quest._id}>
                            <QuestCard
                                quest={quest}
                                onStateChange={mockOnStateChange}
                                onEdit={mockOnEdit}
                            />
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ mt: 4 }}>
                    <h2>Component Features</h2>
                    <ul>
                        <li><strong>Visual State Indicators:</strong> Color-coded left borders (blue for open, orange for in progress, green for done)</li>
                        <li><strong>Priority Badges:</strong> High (red), Medium (orange), Low (green) priority indicators</li>
                        <li><strong>Quest Type Labels:</strong> Clear labels for Bug Fix, Feature Request, Improvement, Research, and Other</li>
                        <li><strong>Creation Date:</strong> Formatted creation date display</li>
                        <li><strong>Interactive Elements:</strong> Edit button with proper accessibility</li>
                        <li><strong>Completed Quest Styling:</strong> Strikethrough text and reduced opacity for done quests</li>
                        <li><strong>Responsive Design:</strong> Cards adapt to different screen sizes</li>
                    </ul>
                </Box>
            </Box>
        </ThemeProvider>
    );
}
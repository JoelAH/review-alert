"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Box,
    Tabs,
    Tab,
    Typography,
    useTheme,
    useMediaQuery,
    Badge,
} from '@mui/material';
import { User } from '@/lib/models/client/user';
import { Quest, QuestState } from '@/lib/models/client/quest';
import { QuestService } from '@/lib/services/quests';
import FeedTab from './dashboard/FeedTab';
import QuestsTab from './dashboard/QuestsTab';
import ProgressTab from './dashboard/ProgressTab';
import CommandCenterTab from './dashboard/CommandCenterTab';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`dashboard-tabpanel-${index}`}
            aria-labelledby={`dashboard-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `dashboard-tab-${index}`,
        'aria-controls': `dashboard-tabpanel-${index}`,
    };
}

export default function NewDashboard({ user }: { user: User | null }) {
    const [value, setValue] = useState(0);
    const [highlightedReviewId, setHighlightedReviewId] = useState<string | null>(null);
    const [questCounts, setQuestCounts] = useState({
        open: 0,
        inProgress: 0,
        total: 0
    });
    const [questsLoading, setQuestsLoading] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Load quest counts for badge indicators
    const loadQuestCounts = useCallback(async () => {
        if (!user) {
            setQuestCounts({ open: 0, inProgress: 0, total: 0 });
            return;
        }

        try {
            setQuestsLoading(true);
            const response = await QuestService.fetchQuests();
            const quests = response.quests;
            
            const counts = {
                open: quests.filter(q => q.state === QuestState.OPEN).length,
                inProgress: quests.filter(q => q.state === QuestState.IN_PROGRESS).length,
                total: quests.length
            };
            
            setQuestCounts(counts);
        } catch (error) {
            console.error('Failed to load quest counts:', error);
            // Don't show error for counts, just keep previous state
        } finally {
            setQuestsLoading(false);
        }
    }, [user]);

    // Load quest counts on mount and when user changes
    useEffect(() => {
        loadQuestCounts();
        
        // Cleanup function to cancel any pending requests
        return () => {
            // Reset quest counts when component unmounts or user changes
            if (!user) {
                setQuestCounts({ open: 0, inProgress: 0, total: 0 });
                setQuestsLoading(false);
            }
        };
    }, [loadQuestCounts, user]);

    // Refresh quest counts when switching to quest tab
    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        // Clear highlighted review when switching tabs
        if (newValue !== 0) {
            setHighlightedReviewId(null);
        }
        // Refresh quest counts when switching to quest tab
        if (newValue === 1 && user) {
            loadQuestCounts();
        }
    };

    const handleViewReview = (reviewId: string) => {
        // Switch to Feed tab and highlight the specific review
        setHighlightedReviewId(reviewId);
        setValue(0); // Switch to Feed tab (index 0)
    };

    // Handle quest operations that affect counts
    const handleQuestCountChange = useCallback(() => {
        // Refresh quest counts when quests are created/updated/deleted
        loadQuestCounts();
    }, [loadQuestCounts]);

    return (
        <Container maxWidth="lg" sx={{ py: 2 }}>
            <Box sx={{ mb: 3 }}>
                <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    component="h1" 
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                >
                    Dashboard
                </Typography>
                <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    Monitor your app reviews and stay on top of user feedback
                </Typography>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                    value={value} 
                    onChange={handleChange} 
                    aria-label="dashboard tabs"
                    variant={isMobile ? "fullWidth" : "standard"}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: isMobile ? '0.875rem' : '1rem',
                            minHeight: isMobile ? 48 : 56,
                        },
                    }}
                >
                    <Tab label="Feed" {...a11yProps(0)} />
                    <Tab 
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>Quests</span>
                                {questCounts.total > 0 && (
                                    <Badge 
                                        badgeContent={questCounts.open + questCounts.inProgress}
                                        color="primary"
                                        max={99}
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                fontSize: '0.75rem',
                                                minWidth: '18px',
                                                height: '18px',
                                                padding: '0 4px',
                                            }
                                        }}
                                    >
                                        <Box sx={{ width: 8 }} />
                                    </Badge>
                                )}
                            </Box>
                        } 
                        {...a11yProps(1)} 
                    />
                    <Tab label="Progress" {...a11yProps(2)} />
                    <Tab label="Command Center" {...a11yProps(3)} />
                </Tabs>
            </Box>

            <TabPanel value={value} index={0}>
                <FeedTab 
                    user={user} 
                    highlightedReviewId={highlightedReviewId}
                    onQuestCountChange={handleQuestCountChange}
                />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <QuestsTab 
                    user={user} 
                    onViewReview={handleViewReview}
                    onQuestCountChange={handleQuestCountChange}
                />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <ProgressTab user={user} />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <CommandCenterTab user={user} />
            </TabPanel>
        </Container>
    );
}
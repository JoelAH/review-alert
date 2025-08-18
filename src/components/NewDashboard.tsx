"use client";

import React, { useState } from 'react';
import {
    Container,
    Box,
    Tabs,
    Tab,
    Typography,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { User } from '@/lib/models/client/user';
import FeedTab from './dashboard/FeedTab';
import QuestsTab from './dashboard/QuestsTab';
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

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
                    <Tab label="Quests" {...a11yProps(1)} />
                    <Tab label="Command Center" {...a11yProps(2)} />
                </Tabs>
            </Box>

            <TabPanel value={value} index={0}>
                <FeedTab user={user} />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <QuestsTab user={user} />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <CommandCenterTab user={user} />
            </TabPanel>
        </Container>
    );
}
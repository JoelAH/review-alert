"use client";

import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Avatar,
    Stack,
    useTheme,
    useMediaQuery,
    Paper,
} from '@mui/material';
import { User } from '@/lib/models/client/user';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AndroidIcon from '@mui/icons-material/Android';
import AppleIcon from '@mui/icons-material/Apple';
import ExtensionIcon from '@mui/icons-material/Extension';

// Mock data for demonstration
const mockReviews = [
    {
        id: 1,
        appName: "My Chrome Extension",
        store: "ChromeExt",
        rating: 5,
        reviewer: "John D.",
        comment: "Amazing extension! Really helps with productivity.",
        date: "2 hours ago",
        isNew: true,
    },
    {
        id: 2,
        appName: "My Android App",
        store: "GooglePlay",
        rating: 4,
        reviewer: "Sarah M.",
        comment: "Great app, but could use some UI improvements.",
        date: "5 hours ago",
        isNew: true,
    },
    {
        id: 3,
        appName: "My iOS App",
        store: "AppleStore",
        rating: 5,
        reviewer: "Mike R.",
        comment: "Perfect! Exactly what I was looking for.",
        date: "1 day ago",
        isNew: false,
    },
];

function getStoreIcon(store: string) {
    switch (store) {
        case 'GooglePlay':
            return <AndroidIcon sx={{ color: '#4CAF50' }} />;
        case 'AppleStore':
            return <AppleIcon sx={{ color: '#000' }} />;
        case 'ChromeExt':
            return <ExtensionIcon sx={{ color: '#4285F4' }} />;
        default:
            return <ExtensionIcon />;
    }
}

function renderStars(rating: number) {
    return (
        <Stack direction="row" spacing={0.5}>
            {[1, 2, 3, 4, 5].map((star) => (
                star <= rating ? 
                    <StarIcon key={star} sx={{ color: '#FFD700', fontSize: '1rem' }} /> :
                    <StarBorderIcon key={star} sx={{ color: '#E0E0E0', fontSize: '1rem' }} />
            ))}
        </Stack>
    );
}

export default function FeedTab({ user }: { user: User | null }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Show setup message if user hasn't configured apps
    if (!user?.apps || user.apps.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" gutterBottom>
                    Welcome to Review Alert!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Add your app store links in the Command Center to start monitoring reviews.
                </Typography>
                <Paper 
                    elevation={1} 
                    sx={{ 
                        p: 3, 
                        maxWidth: 400, 
                        mx: 'auto',
                        backgroundColor: theme.palette.grey[50]
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Once configured, you&apos;ll see all your app reviews here in real-time.
                    </Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Recent Reviews
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Latest feedback from your {user.apps.length} tracked app{user.apps.length > 1 ? 's' : ''}
                </Typography>
            </Box>

            <Grid container spacing={2}>
                {mockReviews.map((review) => (
                    <Grid item xs={12} key={review.id}>
                        <Card 
                            elevation={1}
                            sx={{ 
                                position: 'relative',
                                '&:hover': {
                                    elevation: 2,
                                    transform: 'translateY(-1px)',
                                    transition: 'all 0.2s ease-in-out',
                                }
                            }}
                        >
                            {review.isNew && (
                                <Chip
                                    label="New"
                                    size="small"
                                    color="primary"
                                    sx={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        zIndex: 1,
                                    }}
                                />
                            )}
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: theme.palette.grey[100] }}>
                                        {getStoreIcon(review.store)}
                                    </Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 1, 
                                            mb: 1,
                                            flexWrap: isMobile ? 'wrap' : 'nowrap'
                                        }}>
                                            <Typography 
                                                variant="subtitle2" 
                                                sx={{ 
                                                    fontWeight: 600,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: isMobile ? 'normal' : 'nowrap'
                                                }}
                                            >
                                                {review.appName}
                                            </Typography>
                                            {renderStars(review.rating)}
                                        </Box>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ mb: 1, lineHeight: 1.5 }}
                                        >
                                            &quot;{review.comment}&quot;
                                        </Typography>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 1
                                        }}>
                                            <Typography 
                                                variant="caption" 
                                                color="text.secondary"
                                            >
                                                By {review.reviewer}
                                            </Typography>
                                            <Typography 
                                                variant="caption" 
                                                color="text.secondary"
                                            >
                                                {review.date}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {mockReviews.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                        No reviews yet. We&apos;ll notify you when new reviews come in!
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
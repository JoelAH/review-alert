"use client";

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Rating,
    Chip,
    IconButton,
    useTheme,
    useMediaQuery,
    Divider,
} from '@mui/material';
import {
    Close as CloseIcon,
    Android as AndroidIcon,
    Apple as AppleIcon,
    Extension as ExtensionIcon,
} from '@mui/icons-material';
import { Review, ReviewSentiment } from '@/lib/models/client/review';

export interface ReviewModalProps {
    open: boolean;
    onClose: () => void;
    review: Review | null;
    appName?: string;
    platform?: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
    open,
    onClose,
    review,
    appName = 'Unknown App',
    platform = 'ChromeExt',
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (!review) return null;

    // Platform icon mapping
    const getPlatformIcon = () => {
        switch (platform) {
            case 'GooglePlay':
                return <AndroidIcon sx={{ color: '#4CAF50', fontSize: 24 }} />;
            case 'AppleStore':
                return <AppleIcon sx={{ color: '#000000', fontSize: 24 }} />;
            case 'ChromeExt':
                return <ExtensionIcon sx={{ color: '#4285F4', fontSize: 24 }} />;
            default:
                return <ExtensionIcon sx={{ color: '#4285F4', fontSize: 24 }} />;
        }
    };

    // Sentiment color and label
    const getSentimentConfig = () => {
        switch (review.sentiment) {
            case ReviewSentiment.POSITIVE:
                return { color: 'success', label: 'Positive' };
            case ReviewSentiment.NEGATIVE:
                return { color: 'error', label: 'Negative' };
            default:
                return { color: 'default', label: 'Neutral' };
        }
    };

    // Format date
    const formatDate = (date: Date | string) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const sentimentConfig = getSentimentConfig();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 2,
                    maxHeight: isMobile ? '100vh' : '90vh',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 1,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {getPlatformIcon()}
                    <Typography variant="h6" component="div">
                        Review Details
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{ color: 'text.secondary' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                {/* App and Platform Info */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        {appName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                            label={platform === 'GooglePlay' ? 'Google Play' : 
                                  platform === 'AppleStore' ? 'App Store' : 
                                  'Chrome Web Store'}
                            size="small"
                            variant="outlined"
                        />
                        <Chip
                            label={sentimentConfig.label}
                            size="small"
                            color={sentimentConfig.color as any}
                            variant="filled"
                        />
                    </Box>
                </Box>

                {/* Reviewer Info */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Reviewer Information
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {review.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDate(review.date)}
                        </Typography>
                    </Box>
                    <Rating
                        value={review.rating}
                        readOnly
                        size="medium"
                        sx={{
                            '& .MuiRating-iconFilled': {
                                color: theme.palette.warning.main,
                            },
                        }}
                    />
                </Box>

                {/* Review Comment */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Review Comment
                    </Typography>
                    <Box
                        sx={{
                            p: 2,
                            backgroundColor: theme.palette.grey[50],
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.grey[200]}`,
                        }}
                    >
                        <Typography
                            variant="body1"
                            sx={{
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                            }}
                        >
                            {review.comment}
                        </Typography>
                    </Box>
                </Box>

                {/* Additional Info */}
                {(review.quest || review.priority) && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Analysis
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {review.quest && (
                                <Chip
                                    label={review.quest === 'BUG' ? 'Bug Report' :
                                          review.quest === 'FEATURE_REQUEST' ? 'Feature Request' :
                                          'Other Feedback'}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                />
                            )}
                            {review.priority && (
                                <Chip
                                    label={`${review.priority.charAt(0) + review.priority.slice(1).toLowerCase()} Priority`}
                                    size="small"
                                    variant="outlined"
                                    color={review.priority === 'HIGH' ? 'error' :
                                          review.priority === 'MEDIUM' ? 'warning' : 'success'}
                                />
                            )}
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} variant="contained" fullWidth={isMobile}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReviewModal;
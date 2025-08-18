"use client";

import React, { useEffect, useState } from 'react';
import {
    Typography,
    TextField,
    Box,
    Paper,
    Snackbar,
    Grid,
    Card,
    CardContent,
    Stack,
    useTheme,
    useMediaQuery,
    Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AndroidIcon from '@mui/icons-material/Android';
import AppleIcon from '@mui/icons-material/Apple';
import ExtensionIcon from '@mui/icons-material/Extension';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { User } from '@/lib/models/client/user';
import { useFormState, useFormStatus } from 'react-dom';
import { LoadingButton } from '@mui/lab';
import { onSaveInfo } from '@/actions/onSaveInfo';

function ConfirmSubmit(): JSX.Element {
    const { pending } = useFormStatus();

    return (
        <LoadingButton
            disabled={pending}
            loading={pending}
            color='primary'
            size="medium"
            type='submit'
            variant="contained"
            startIcon={<SaveIcon />}
            fullWidth
        >
            <span>Save Configuration</span>
        </LoadingButton>
    )
}

function getStoreInfo(store: string) {
    switch (store) {
        case 'GooglePlay':
            return {
                name: 'Google Play Store',
                icon: <AndroidIcon sx={{ color: '#4CAF50' }} />,
                color: '#4CAF50'
            };
        case 'AppleStore':
            return {
                name: 'Apple App Store',
                icon: <AppleIcon sx={{ color: '#000' }} />,
                color: '#000'
            };
        case 'ChromeExt':
            return {
                name: 'Chrome Web Store',
                icon: <ExtensionIcon sx={{ color: '#4285F4' }} />,
                color: '#4285F4'
            };
        default:
            return {
                name: 'Unknown Store',
                icon: <ExtensionIcon />,
                color: '#666'
            };
    }
}

export default function CommandCenterTab({ user }: { user: User | null }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [email, setEmail] = useState('');
    const [chromeLink, setChromeLink] = useState('');
    const [playStoreLink, setPlayStoreLink] = useState('');
    const [appStoreLink, setAppStoreLink] = useState('');

    const [chromeLinkId, setChromeLinkId] = useState('');
    const [playStoreLinkId, setPlayStoreLinkId] = useState('');
    const [appStoreLinkId, setAppStoreLinkId] = useState('');

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [state, formAction] = useFormState(onSaveInfo, {});

    useEffect(() => {
        if (state?.success) {
            setOpenSnackbar(true);
        }
    }, [state])

    useEffect(() => {
        if (user) {
            setEmail(user.email || '');
            setPlayStoreLink(user.apps?.find(app => app.store === 'GooglePlay')?.url || '');
            setAppStoreLink(user.apps?.find(app => app.store === 'AppleStore')?.url || '');
            setChromeLink(user.apps?.find(app => app.store === 'ChromeExt')?.url || '');

            setPlayStoreLinkId(user.apps?.find(app => app.store === 'GooglePlay')?._id || '');
            setAppStoreLinkId(user.apps?.find(app => app.store === 'AppleStore')?._id || '');
            setChromeLinkId(user.apps?.find(app => app.store === 'ChromeExt')?._id || '');
        }
    }, [user])

    const trackedApps = user?.apps || [];

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Settings & Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage your app tracking and notification preferences
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Current Apps Overview */}
                {trackedApps.length > 0 && (
                    <Grid item xs={12}>
                        <Paper elevation={1} sx={{ p: 3, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <NotificationsIcon color="primary" />
                                <Typography variant="h6">
                                    Currently Tracking
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                {trackedApps.map((app, index) => {
                                    const storeInfo = getStoreInfo(app.store);
                                    return (
                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                            <Card 
                                                elevation={0} 
                                                sx={{ 
                                                    border: 1, 
                                                    borderColor: 'divider',
                                                    backgroundColor: theme.palette.grey[50]
                                                }}
                                            >
                                                <CardContent sx={{ p: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        {storeInfo.icon}
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                            {storeInfo.name}
                                                        </Typography>
                                                    </Box>
                                                    <Typography 
                                                        variant="caption" 
                                                        color="text.secondary"
                                                        sx={{ 
                                                            display: 'block',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {app.url}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                            <Box sx={{ mt: 2, p: 2, backgroundColor: theme.palette.primary.main + '10', borderRadius: 1 }}>
                                <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                                    ✓ You&apos;re receiving notifications every 4 hours for new reviews
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                )}

                {/* Configuration Form */}
                <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            {trackedApps.length > 0 ? 'Update Configuration' : 'Initial Setup'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {trackedApps.length > 0 
                                ? 'Modify your app links and notification settings'
                                : 'Add your app store links and email to get started'
                            }
                        </Typography>

                        <Box component="form" action={formAction} noValidate autoComplete="off">
                            {/* Email Configuration */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                    Notification Email
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    We&apos;ll send review alerts to this email address
                                </Typography>
                                <TextField
                                    name='email'
                                    fullWidth
                                    label="Email Address"
                                    placeholder='your-email@gmail.com'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    variant="outlined"
                                />
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            {/* App Store Links */}
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                    App Store Links
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Add links to your apps on different platforms
                                </Typography>

                                <Stack spacing={3}>
                                    {/* Chrome Web Store */}
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <ExtensionIcon sx={{ color: '#4285F4' }} />
                                            <Typography variant="subtitle2">Chrome Web Store</Typography>
                                        </Box>
                                        <input name='chromeId' type='hidden' value={chromeLinkId || state?.user?.chromeId} />
                                        <TextField
                                            name='chrome'
                                            fullWidth
                                            label="Chrome Extension Link"
                                            placeholder='https://chromewebstore.google.com/detail/your-extension/...'
                                            value={chromeLink}
                                            onChange={(e) => setChromeLink(e.target.value)}
                                            variant="outlined"
                                            size={isMobile ? "medium" : "small"}
                                        />
                                    </Box>

                                    {/* Google Play Store */}
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <AndroidIcon sx={{ color: '#4CAF50' }} />
                                            <Typography variant="subtitle2">Google Play Store</Typography>
                                        </Box>
                                        <input name='googleId' type='hidden' value={playStoreLinkId || state?.user?.googleId} />
                                        <TextField
                                            name='google'
                                            fullWidth
                                            label="Android App Link"
                                            placeholder='https://play.google.com/store/apps/details?id=your.app.package'
                                            value={playStoreLink}
                                            onChange={(e) => setPlayStoreLink(e.target.value)}
                                            variant="outlined"
                                            size={isMobile ? "medium" : "small"}
                                        />
                                    </Box>

                                    {/* Apple App Store */}
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <AppleIcon sx={{ color: '#000' }} />
                                            <Typography variant="subtitle2">Apple App Store</Typography>
                                        </Box>
                                        <input name='appleId' type='hidden' value={appStoreLinkId || state?.user?.appleId} />
                                        <TextField
                                            name='apple'
                                            fullWidth
                                            label="iOS App Link"
                                            placeholder='https://apps.apple.com/app/your-app/id123456789'
                                            value={appStoreLink}
                                            onChange={(e) => setAppStoreLink(e.target.value)}
                                            variant="outlined"
                                            size={isMobile ? "medium" : "small"}
                                        />
                                    </Box>
                                </Stack>
                            </Box>

                            <Box sx={{ mt: 3 }}>
                                <ConfirmSubmit />
                            </Box>

                            {state?.errors?.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Paper 
                                        elevation={0} 
                                        sx={{ 
                                            p: 2, 
                                            backgroundColor: theme.palette.error.main + '10',
                                            border: 1,
                                            borderColor: theme.palette.error.main + '30'
                                        }}
                                    >
                                        <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                                            Please fix the following issues:
                                        </Typography>
                                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                                            {state.errors.map((error: string, index: number) => (
                                                <li key={index}>
                                                    <Typography variant="body2" color="error">
                                                        {error}
                                                    </Typography>
                                                </li>
                                            ))}
                                        </ul>
                                    </Paper>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                onClose={() => setOpenSnackbar(false)}
                message="Configuration saved successfully!"
            />
        </Box>
    );
}
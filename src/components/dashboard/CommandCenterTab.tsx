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
    useTheme,
    Divider,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AndroidIcon from '@mui/icons-material/Android';
import AppleIcon from '@mui/icons-material/Apple';
import ExtensionIcon from '@mui/icons-material/Extension';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { User } from '@/lib/models/client/user';
import { useFormState, useFormStatus } from 'react-dom';
import { LoadingButton } from '@mui/lab';
import { onSaveEmail } from '@/actions/onSaveEmail';
import { onSaveApp } from '@/actions/onSaveApp';
import { onDeleteApp } from '@/actions/onDeleteApp';
import { GamificationClientService } from '@/lib/services/gamificationClient';
import { XPAction } from '@/types/gamification';

function SaveEmailButton(): JSX.Element {
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
        >
            <span>Save Email</span>
        </LoadingButton>
    );
}

function SaveAppButton({ disabled = false }: { disabled?: boolean }): JSX.Element {
    const { pending } = useFormStatus();

    return (
        <LoadingButton
            disabled={pending || disabled}
            loading={pending}
            color='primary'
            size="medium"
            type='submit'
            variant="contained"
            startIcon={<SaveIcon />}
            fullWidth
        >
            <span>Save App</span>
        </LoadingButton>
    );
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

type StoreType = 'ChromeExt' | 'GooglePlay' | 'AppleStore';

interface AppDialogState {
    open: boolean;
    store: StoreType | null;
    url: string;
    appName: string;
    isEdit: boolean;
    editingAppId?: string;
}

export default function CommandCenterTab({ user }: { user: User | null }) {
    const theme = useTheme();
    
    const [email, setEmail] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    
    // Dialog state for app management
    const [appDialog, setAppDialog] = useState<AppDialogState>({
        open: false,
        store: null,
        url: '',
        appName: '',
        isEdit: false,
        editingAppId: undefined
    });

    // Form states
    const [emailState, emailAction] = useFormState(onSaveEmail, {});
    const [appState, appAction] = useFormState(onSaveApp, {});
    const [deleteState, deleteAction] = useFormState(onDeleteApp, {});

    useEffect(() => {
        if (emailState?.success) {
            setSnackbarMessage(emailState.message);
            setOpenSnackbar(true);
        }
    }, [emailState]);

    useEffect(() => {
        if (appState?.success) {
            setSnackbarMessage(appState.message);
            setOpenSnackbar(true);
            setAppDialog({ open: false, store: null, url: '', appName: '', isEdit: false, editingAppId: undefined });
            
            // Handle XP award notification if present
            if (appState.xpAwarded) {
                GamificationClientService.handleXPAwardResult(appState.xpAwarded, XPAction.APP_ADDED);
            }
        }
    }, [appState]);

    useEffect(() => {
        if (deleteState?.success) {
            setSnackbarMessage(deleteState.message);
            setOpenSnackbar(true);
        }
    }, [deleteState]);

    useEffect(() => {
        if (user) {
            setEmail(user.email || '');
        }
    }, [user]);

    const trackedApps = user?.apps || [];

    const handleOpenAppDialog = (store: StoreType | null = null, isEdit: boolean = false, appId?: string) => {
        let existingApp;
        if (isEdit && appId) {
            existingApp = user?.apps?.find(app => app._id === appId);
        }
        
        setAppDialog({
            open: true,
            store: store || existingApp?.store || null,
            url: existingApp?.url || '',
            appName: existingApp?.appName || '',
            isEdit,
            editingAppId: appId
        });
    };

    const handleCloseAppDialog = () => {
        setAppDialog({ open: false, store: null, url: '', appName: '', isEdit: false, editingAppId: undefined });
    };

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Settings & Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage your notification email and tracked apps individually
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Email Configuration */}
                <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <NotificationsIcon color="primary" />
                            <Typography variant="h6">
                                Notification Email
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            We&apos;ll send review notifications to this email address every 4 hours
                        </Typography>

                        <Box component="form" action={emailAction} noValidate autoComplete="off">
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <TextField
                                    name='email'
                                    fullWidth
                                    label="Email Address"
                                    placeholder='your-email@gmail.com'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                />
                                <SaveEmailButton />
                            </Box>

                            {emailState?.errors?.length > 0 && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {emailState.errors[0]}
                                </Alert>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Current Apps Overview */}
                <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">
                                Tracked Apps
                            </Typography>
                        </Box>

                        {trackedApps.length > 0 ? (
                            <>
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
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                {storeInfo.icon}
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                    {storeInfo.name}
                                                                </Typography>
                                                            </Box>
                                                            <Box>
                                                                <IconButton 
                                                                    size="small" 
                                                                    onClick={() => handleOpenAppDialog(null, true, app._id)}
                                                                    sx={{ mr: 0.5 }}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                                <Box component="form" action={deleteAction} sx={{ display: 'inline' }}>
                                                                    <input type="hidden" name="appId" value={app._id} />
                                                                    <IconButton 
                                                                        size="small" 
                                                                        color="error"
                                                                        type="submit"
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            </Box>
                                                        </Box>
                                                        <Typography 
                                                            variant="body2" 
                                                            sx={{ 
                                                                fontWeight: 500,
                                                                mb: 0.5,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {app.appName}
                                                        </Typography>
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
                                        ✓ You&apos;re receiving notifications for new reviews
                                    </Typography>
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    No apps are currently being tracked
                                </Typography>
                            </Box>
                        )}

                        {/* Add App Button */}
                        <Divider sx={{ my: 3 }} />
                        <Box sx={{ textAlign: 'center' }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenAppDialog()}
                                sx={{ py: 1.5, px: 4 }}
                            >
                                Add New App
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* App Dialog */}
            <Dialog 
                open={appDialog.open} 
                onClose={handleCloseAppDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {appDialog.isEdit ? 'Edit App' : 'Add New App'}
                </DialogTitle>
                <Box component="form" action={appAction}>
                    <DialogContent>
                        <input type="hidden" name="store" value={appDialog.store || ''} />
                        <input type="hidden" name="appId" value={appDialog.editingAppId || ''} />
                        
                        {/* Store Selector - only show for new apps */}
                        {!appDialog.isEdit && (
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>App Store</InputLabel>
                                <Select
                                    value={appDialog.store || ''}
                                    label="App Store"
                                    onChange={(e) => setAppDialog(prev => ({ 
                                        ...prev, 
                                        store: e.target.value as StoreType,
                                        url: '', // Reset URL when store changes
                                        appName: '' // Reset app name when store changes
                                    }))}
                                >
                                    <MenuItem value="ChromeExt">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ExtensionIcon sx={{ color: '#4285F4' }} />
                                            Chrome Web Store
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="GooglePlay">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AndroidIcon sx={{ color: '#4CAF50' }} />
                                            Google Play Store
                                        </Box>
                                    </MenuItem>
                                    <MenuItem value="AppleStore">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <AppleIcon sx={{ color: '#000' }} />
                                            Apple App Store
                                        </Box>
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        {/* Store info for edit mode */}
                        {appDialog.isEdit && appDialog.store && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                                {getStoreInfo(appDialog.store).icon}
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {getStoreInfo(appDialog.store).name}
                                </Typography>
                            </Box>
                        )}
                        
                        <TextField
                            name="appName"
                            fullWidth
                            label="App Name"
                            placeholder="Enter your app name"
                            value={appDialog.appName}
                            onChange={(e) => setAppDialog(prev => ({ ...prev, appName: e.target.value }))}
                            variant="outlined"
                            sx={{ mb: 2 }}
                            disabled={!appDialog.store}
                            helperText={!appDialog.store && !appDialog.isEdit ? "Please select an app store first" : ""}
                        />
                        
                        <TextField
                            name="url"
                            fullWidth
                            label="App URL"
                            placeholder={getPlaceholder(appDialog.store)}
                            value={appDialog.url}
                            onChange={(e) => setAppDialog(prev => ({ ...prev, url: e.target.value }))}
                            variant="outlined"
                            disabled={!appDialog.store}
                            helperText={!appDialog.store && !appDialog.isEdit ? "Please select an app store first" : ""}
                        />

                        {appState?.errors?.length > 0 && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                <ul style={{ margin: 0, paddingLeft: 20 }}>
                                    {appState.errors.map((error: string, index: number) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 1 }}>
                        <Button onClick={handleCloseAppDialog}>Cancel</Button>
                        <SaveAppButton disabled={!appDialog.store || !appDialog.appName.trim()} />
                    </DialogActions>
                </Box>
            </Dialog>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                onClose={() => setOpenSnackbar(false)}
                message={snackbarMessage}
            />
        </Box>
    );

    function getPlaceholder(store: StoreType | null): string {
        switch (store) {
            case 'ChromeExt':
                return 'https://chromewebstore.google.com/detail/your-extension/...';
            case 'GooglePlay':
                return 'https://play.google.com/store/apps/details?id=your.app.package';
            case 'AppleStore':
                return 'https://apps.apple.com/app/your-app/id123456789';
            default:
                return '';
        }
    }
}
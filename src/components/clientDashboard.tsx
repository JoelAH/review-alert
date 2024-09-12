"use client";

import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Box,
    Paper,
    Snackbar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
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
        >
            <span>Save</span>
        </LoadingButton>
    )
}

export default function ClientDashboard({ user }: { user: User | null }) {
    const [email, setEmail] = useState('');
    const [chromeLink, setChromeLink] = useState('');
    const [playStoreLink, setPlayStoreLink] = useState('');
    const [appStoreLink, setAppStoreLink] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const [state, formAction] = useFormState(onSaveInfo, {});

    const handleSave = () => {
        // Here you would typically send this data to your backend
        console.log({ email, chromeLink, playStoreLink, appStoreLink });
        setOpenSnackbar(true);
    };

    const initData = () => {
        if (user) {
            setEmail(user.email || '');
            setPlayStoreLink(user.apps?.find(app => app.store === 'GooglePlay')?.url || '');
            setAppStoreLink(user.apps?.find(app => app.store === 'AppleStore')?.url || '');
            setChromeLink(user.apps?.find(app => app.store === 'ChromeExt')?.url || '');
        }
    }

    useEffect(() => {
        initData();
    }, [])

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Dashboard
                </Typography>
                <Typography variant="h6" component="h1" gutterBottom>
                    {
                        (!user?.email || !user?.apps || (user.apps?.length <= 0)) ?
                            (
                                <>Add your info below and save</>
                            ) :
                            (
                                <>
                                    You are receiving notifications every 4 hours if there is a review for {user.apps.length} apps
                                </>
                            )
                    }
                </Typography>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Box component="form" action={formAction} noValidate autoComplete="off">
                        <Typography>Enter the email address we should send notifications to</Typography>
                        <TextField
                            name='email'
                            fullWidth
                            margin="normal"
                            label="Email"
                            placeholder='myname@gmail.com'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Typography sx={{ marginTop: 5 }}>Add any of your links below</Typography>
                        <TextField
                            name='chrome'
                            fullWidth
                            margin="normal"
                            label="Chrome Web Store Link"
                            placeholder='https://chromewebstore.google.com/detail/chatgpt-folders/lapefebfdhoomaehglkomljbpfbjcham'
                            value={chromeLink}
                            onChange={(e) => setChromeLink(e.target.value)}
                        />
                        <TextField
                            name='google'
                            fullWidth
                            margin="normal"
                            label="Google Play Store Link"
                            placeholder='https://play.google.com/store/apps/details?id=com.instagram.android&hl=en'
                            value={playStoreLink}
                            onChange={(e) => setPlayStoreLink(e.target.value)}
                        />
                        <TextField
                            name='apple'
                            fullWidth
                            margin="normal"
                            label="Apple App Store Link"
                            placeholder='https://apps.apple.com/us/app/instagram/id389801252'
                            value={appStoreLink}
                            onChange={(e) => setAppStoreLink(e.target.value)}
                        />
                        <Box sx={{ mt: 2 }}>
                            <ConfirmSubmit />
                        </Box>
                        {
                            state?.errors?.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <ul style={{ color: 'red' }}>
                                        {
                                            state.errors.map((e: string) => <li key={e}>{e}</li>)
                                        }
                                    </ul>
                                </Box>
                            )
                        }
                    </Box>
                </Paper>
            </Box>
            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                onClose={() => setOpenSnackbar(false)}
                message="Info saved successfully!"
            />
        </Container>
    );
};
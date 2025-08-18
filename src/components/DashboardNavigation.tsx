'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { signOut } from '@/lib/firebase/auth';
import { signOutOfServer } from '@/lib/services/auth';
import SettingsIcon from '@mui/icons-material/Settings';

/**
 * Navigation component specifically for authenticated dashboard pages
 * Includes dashboard/settings navigation and sign out functionality
 */
export default function DashboardNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSignOut = async () => {
    try {
      await signOut();
      await signOutOfServer();
      router.replace('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleLogoClick = () => {
    router.push('/dashboard');
  };

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={1}
      component="nav"
      role="banner"
      sx={{
        background: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        minHeight: '64px'
      }}
    >
      <Toolbar sx={{ py: 1, minHeight: '64px' }}>
        {/* Logo/Brand */}
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          component="button"
          onClick={handleLogoClick}
          sx={{
            flexGrow: 1,
            fontWeight: 800,
            fontSize: { xs: '1.25rem', sm: '1.75rem' },
            background: 'linear-gradient(135deg, #1976d2, #FF6B6B)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            '&:hover': {
              opacity: 0.8
            },
            '&:focus': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: '2px'
            }
          }}
          aria-label="Review Alert - Go to Dashboard"
        >
          Review Alert
        </Typography>

        {/* Navigation Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Dashboard Link */}
          {pathname !== '/dashboard' && (
            <Button
              variant="outlined"
              color="primary"
              size={isMobile ? 'small' : 'medium'}
              onClick={() => router.push('/dashboard')}
              sx={{
                minWidth: { xs: 'auto', sm: '100px' },
                px: { xs: 1.5, sm: 2 }
              }}
            >
              Dashboard
            </Button>
          )}

          {/* Settings Link */}
          <Button
            variant={pathname === '/settings' ? 'contained' : 'outlined'}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            onClick={() => router.push('/settings')}
            startIcon={!isMobile ? <SettingsIcon /> : undefined}
            sx={{
              minWidth: { xs: 'auto', sm: '100px' },
              px: { xs: 1.5, sm: 2 }
            }}
            aria-current={pathname === '/settings' ? 'page' : undefined}
          >
            {isMobile ? <SettingsIcon /> : 'Settings'}
          </Button>

          {/* Sign Out Button */}
          <Button
            variant="outlined"
            color="primary"
            size={isMobile ? 'small' : 'medium'}
            onClick={handleSignOut}
            sx={{
              minWidth: { xs: 'auto', sm: '80px' },
              px: { xs: 1.5, sm: 2 }
            }}
          >
            Sign Out
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
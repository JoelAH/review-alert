'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useRouter } from 'next/navigation';

export interface NavigationProps {
  /** Whether the user is authenticated */
  isAuthenticated?: boolean;
  /** Current page path for active state */
  currentPath?: string;
  /** Whether to show transparent background (for landing page) */
  transparent?: boolean;
  /** Whether to show sign out button */
  showSignOut?: boolean;
  /** Sign out handler */
  onSignOut?: () => void;
}

export default function Navigation({
  isAuthenticated = false,
  currentPath = '',
  transparent = false,
  showSignOut = false,
  onSignOut
}: NavigationProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
  };

  const handleLogoClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <AppBar
      position={transparent ? 'fixed' : 'static'}
      color="transparent"
      elevation={transparent ? 0 : 1}
      component="nav"
      role="banner"
      sx={{
        background: transparent
          ? 'rgba(255, 255, 255, 0.8)'
          : theme.palette.background.paper,
        backdropFilter: transparent ? 'blur(10px)' : 'none',
        borderBottom: transparent
          ? '1px solid rgba(255, 255, 255, 0.2)'
          : `1px solid ${theme.palette.divider}`,
        zIndex: 1000,
        top: 0,
        left: 0,
        right: 0,
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
          aria-label={isAuthenticated ? "ReviewQuest - Go to Dashboard" : "ReviewQuest - Home"}
        >
          ReviewQuest
        </Typography>

        {/* Navigation Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isAuthenticated ? (
            <>
              {/* Login Button */}
              <Button
                variant={currentPath === '/login' ? 'contained' : 'outlined'}
                color="primary"
                size={isMobile ? 'small' : 'medium'}
                onClick={() => router.push('/login')}
                sx={{
                  minWidth: { xs: 'auto', sm: '80px' },
                  px: { xs: 1.5, sm: 2 }
                }}
                aria-current={currentPath === '/login' ? 'page' : undefined}
              >
                {isMobile ? 'Login' : 'Sign In'}
              </Button>

              {/* Signup Button */}
              <Button
                variant={currentPath === '/signup' ? 'contained' : 'contained'}
                color="primary"
                size={isMobile ? 'small' : 'medium'}
                onClick={() => router.push('/signup')}
                sx={{
                  minWidth: { xs: 'auto', sm: '80px' },
                  px: { xs: 1.5, sm: 2 },
                  ...(currentPath === '/signup' && {
                    backgroundColor: theme.palette.primary.dark
                  })
                }}
                aria-current={currentPath === '/signup' ? 'page' : undefined}
              >
                {isMobile ? 'Sign Up' : 'Get Started'}
              </Button>
            </>
          ) : (
            <>
              {/* Dashboard Link (if not already on dashboard) */}
              {currentPath !== '/dashboard' && (
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

              {/* Sign Out Button */}
              {showSignOut && (
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
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
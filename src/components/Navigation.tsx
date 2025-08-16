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
import NextLink from 'next/link';
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
      position={transparent ? 'absolute' : 'static'}
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
        zIndex: 10
      }}
    >
      <Toolbar sx={{ py: 1 }}>
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
          aria-label={isAuthenticated ? "Review Alert - Go to Dashboard" : "Review Alert - Home"}
        >
          Review Alert
        </Typography>

        {/* Navigation Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isAuthenticated ? (
            <>
              {/* Login Button */}
              <NextLink href="/login" passHref legacyBehavior>
                <Button
                  component="a"
                  variant={currentPath === '/login' ? 'contained' : 'outlined'}
                  color="primary"
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    minWidth: { xs: 'auto', sm: '80px' },
                    px: { xs: 1.5, sm: 2 }
                  }}
                  aria-current={currentPath === '/login' ? 'page' : undefined}
                >
                  {isMobile ? 'Login' : 'Sign In'}
                </Button>
              </NextLink>

              {/* Signup Button */}
              <NextLink href="/signup" passHref legacyBehavior>
                <Button
                  component="a"
                  variant={currentPath === '/signup' ? 'contained' : 'contained'}
                  color="primary"
                  size={isMobile ? 'small' : 'medium'}
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
              </NextLink>
            </>
          ) : (
            <>
              {/* Dashboard Link (if not already on dashboard) */}
              {currentPath !== '/dashboard' && (
                <NextLink href="/dashboard" passHref legacyBehavior>
                  <Button
                    component="a"
                    variant="outlined"
                    color="primary"
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                      minWidth: { xs: 'auto', sm: '100px' },
                      px: { xs: 1.5, sm: 2 }
                    }}
                  >
                    Dashboard
                  </Button>
                </NextLink>
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
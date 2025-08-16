'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';

export interface AuthRedirectProps {
  /** Redirect authenticated users to this path */
  redirectTo?: string;
  /** Redirect unauthenticated users to this path */
  requireAuth?: boolean;
  /** Path to redirect unauthenticated users */
  loginPath?: string;
  /** Children to render if no redirect is needed */
  children?: React.ReactNode;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
}

/**
 * Component that handles authentication-based redirects
 * Can redirect authenticated users away from auth pages or redirect unauthenticated users to login
 */
export default function AuthRedirect({
  redirectTo = '/dashboard',
  requireAuth = false,
  loginPath = '/login',
  children,
  loadingComponent
}: AuthRedirectProps) {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth state to be determined

    if (requireAuth && !isAuthenticated) {
      // Redirect unauthenticated users to login
      router.replace(loginPath);
      return;
    }

    if (!requireAuth && isAuthenticated && redirectTo) {
      // Redirect authenticated users away from auth pages
      router.replace(redirectTo);
      return;
    }
  }, [loading, isAuthenticated, requireAuth, redirectTo, loginPath, router]);

  // Show loading state while determining auth status
  if (loading) {
    return loadingComponent || (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          gap: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // If we need auth and user is not authenticated, don't render children (redirect will happen)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If we don't need auth and user is authenticated, don't render children (redirect will happen)
  if (!requireAuth && isAuthenticated && redirectTo) {
    return null;
  }

  // Render children if no redirect is needed
  return <>{children}</>;
}
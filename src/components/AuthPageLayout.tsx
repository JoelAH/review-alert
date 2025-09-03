'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import NextLink from 'next/link';

export interface AuthPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  alternateAction: {
    text: string;
    linkText: string;
    href: string;
  };
}

export default function AuthPageLayout({ 
  title, 
  subtitle, 
  children, 
  alternateAction 
}: AuthPageLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.grey[50],
        py: { xs: 2, sm: 4 }
      }}
    >
      {/* Skip to main content link for accessibility */}
      <Link
        href="#main-content"
        sx={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 999,
          padding: 1,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          textDecoration: 'none',
          '&:focus': {
            left: '10px',
            top: '10px'
          }
        }}
      >
        Skip to main content
      </Link>

      <Container 
        component="main" 
        maxWidth="sm"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {/* ReviewQuest Branding */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            component="h2"
            sx={{
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              mb: 1
            }}
          >
            ReviewQuest
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 400 }}
          >
            Monitor reviews across multiple app stores
          </Typography>
        </Box>

        {/* Main Authentication Card */}
        <Paper
          elevation={isMobile ? 0 : 3}
          sx={{
            width: '100%',
            maxWidth: 450,
            p: { xs: 3, sm: 4 },
            borderRadius: 2,
            backgroundColor: isMobile ? 'transparent' : 'background.paper'
          }}
          id="main-content"
        >
          {/* Page Title and Subtitle */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 'medium' }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Main Content (Form) */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {children}
          </Box>

          {/* Alternate Action Link */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {alternateAction.text}{' '}
              <NextLink href={alternateAction.href} passHref legacyBehavior>
                <Link
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    fontWeight: 'medium',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {alternateAction.linkText}
                </Link>
              </NextLink>
            </Typography>
          </Box>
        </Paper>

        {/* Footer Links */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            <NextLink href="/privacy" passHref legacyBehavior>
              <Link
                sx={{
                  color: 'inherit',
                  textDecoration: 'none',
                  mx: 1,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Privacy Policy
              </Link>
            </NextLink>
            •
            <NextLink href="/terms" passHref legacyBehavior>
              <Link
                sx={{
                  color: 'inherit',
                  textDecoration: 'none',
                  mx: 1,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Terms of Service
              </Link>
            </NextLink>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
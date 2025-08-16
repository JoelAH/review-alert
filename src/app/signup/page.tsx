'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Divider, Typography } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AuthPageLayout from '@/components/AuthPageLayout';
import EmailAuthForm from '@/components/EmailAuthForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import AuthRedirect from '@/components/AuthRedirect';
import GoogleButton from 'react-google-button';
import { 
  handleGoogleSignIn, 
  handleEmailSignUp
} from '@/lib/utils/authHandlers';
import { EnhancedAuthError } from '@/lib/utils/authErrorHandler';

export default function SignupPage() {
  const router = useRouter();
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<EnhancedAuthError | string>('');
  const [, setRetryCount] = useState(0);

  // Handle email signup with enhanced error handling
  const handleEmailSignup = async (email: string, password: string) => {
    setEmailLoading(true);
    setError('');

    await handleEmailSignUp(email, password, router, {
      redirectTo: '/dashboard',
      enableRetry: true,
      onSuccess: () => {
        toast.success('Account created successfully! Redirecting to dashboard...', {
          position: 'top-right',
          autoClose: 2000
        });
        setRetryCount(0);
      },
      onError: (enhancedError) => {
        setError(enhancedError);
        toast.error(enhancedError.userMessage, {
          position: 'top-right'
        });
        setEmailLoading(false);
      }
    });
  };

  // Handle Google signup with enhanced error handling
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError('');

    await handleGoogleSignIn(router, {
      redirectTo: '/dashboard',
      enableRetry: true,
      onSuccess: () => {
        toast.success('Account created successfully! Redirecting to dashboard...', {
          position: 'top-right',
          autoClose: 2000
        });
        setRetryCount(0);
      },
      onError: (enhancedError) => {
        setError(enhancedError);
        toast.error(enhancedError.userMessage, {
          position: 'top-right'
        });
        setGoogleLoading(false);
      }
    });
  };

  // Handle retry for failed operations
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError('');
    
    // Determine which operation to retry based on current state
    if (emailLoading) {
      // This would need the last email/password values - in a real implementation
      // you'd store these or restructure the component
      toast.info('Please try submitting the form again.', {
        position: 'top-right'
      });
    } else if (googleLoading) {
      handleGoogleSignup();
    }
  };

  // Handle error action buttons
  const handleErrorAction = (action: () => void) => {
    action();
  };

  const isLoading = emailLoading || googleLoading;

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Sign Up', current: true }
  ];

  return (
    <AuthRedirect redirectTo="/dashboard">
      <ToastContainer />
      
      {/* Breadcrumb Navigation */}
      <Breadcrumbs items={breadcrumbItems} />
      
      <AuthPageLayout
        title="Create Your Account"
        subtitle="Start monitoring your app reviews across multiple stores"
        alternateAction={{
          text: "Already have an account?",
          linkText: "Sign in",
          href: "/login"
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Email Signup Form */}
          <EmailAuthForm
            mode="signup"
            onSubmit={handleEmailSignup}
            loading={emailLoading}
            error={error}
            onRetry={handleRetry}
            onErrorAction={handleErrorAction}
          />

          {/* Divider */}
          <Box sx={{ my: 3, display: 'flex', alignItems: 'center' }}>
            <Divider sx={{ flex: 1 }} />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ mx: 2, whiteSpace: 'nowrap' }}
            >
              or continue with
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>

          {/* Google Signup Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleButton
              onClick={handleGoogleSignup}
              disabled={isLoading}
              style={{ 
                width: '100%',
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            />
          </Box>
        </Box>
      </AuthPageLayout>
    </AuthRedirect>
  );
}
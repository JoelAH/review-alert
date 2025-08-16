'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Divider, Typography } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GoogleButton from 'react-google-button';
import { AuthError } from 'firebase/auth';

import AuthPageLayout from '@/components/AuthPageLayout';
import EmailAuthForm from '@/components/EmailAuthForm';
import { signInWithEmail, signInWithGoogle, getAuthErrorMessage } from '@/lib/firebase/auth';
import { signInToServer } from '@/lib/services/auth';
import CONSTANTS from '@/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleEmailLogin = async (email: string, password: string) => {
    setEmailLoading(true);
    setError('');

    try {
      // Sign in user with Firebase Auth
      const userCredential = await signInWithEmail(email, password);
      
      if (!userCredential?.user) {
        throw new Error('Failed to sign in');
      }

      // Sign in to server to create session
      await signInToServer(userCredential.user);
      
      // Show success message
      toast.success('Signed in successfully! Redirecting to dashboard...', {
        position: 'top-right',
        autoClose: 2000
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Email login error:', error);
      
      let errorMessage = 'An error occurred during login. Please try again.';
      
      if (error && typeof error === 'object' && 'code' in error) {
        errorMessage = getAuthErrorMessage(error as AuthError);
      }
      
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right'
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const userCredential = await signInWithGoogle();
      
      if (!userCredential?.user) {
        throw new Error('Failed to sign in with Google');
      }

      // Sign in to server to create session
      await signInToServer(userCredential.user);
      
      // Show success message
      toast.success('Signed in successfully! Redirecting to dashboard...', {
        position: 'top-right',
        autoClose: 2000
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Google login error:', error);
      
      let errorMessage = CONSTANTS.errors.defaultMessage;
      
      if (error && typeof error === 'object' && 'code' in error) {
        errorMessage = getAuthErrorMessage(error as AuthError);
      }
      
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right'
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const isLoading = emailLoading || googleLoading;

  return (
    <>
      <ToastContainer />
      <AuthPageLayout
        title="Welcome Back"
        subtitle="Sign in to continue monitoring your app reviews"
        alternateAction={{
          text: "Don't have an account?",
          linkText: "Sign up",
          href: "/signup"
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Email Login Form */}
          <EmailAuthForm
            mode="login"
            onSubmit={handleEmailLogin}
            loading={emailLoading}
            error={error}
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

          {/* Google Login Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleButton
              onClick={handleGoogleLogin}
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
    </>
  );
}
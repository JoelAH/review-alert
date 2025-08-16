'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Divider, Typography } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AuthPageLayout from '@/components/AuthPageLayout';
import EmailAuthForm from '@/components/EmailAuthForm';
import { signUpWithEmail, signInWithGoogle, getAuthErrorMessage } from '@/lib/firebase/auth';
import { signInToServer } from '@/lib/services/auth';
import { AuthError } from 'firebase/auth';
import GoogleButton from 'react-google-button';
import CONSTANTS from '@/lib/constants';

export default function SignupPage() {
  const router = useRouter();
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Handle email signup
  const handleEmailSignup = async (email: string, password: string) => {
    setEmailLoading(true);
    setError('');

    try {
      // Create user with Firebase Auth
      const userCredential = await signUpWithEmail(email, password);
      
      if (!userCredential?.user) {
        throw new Error('Failed to create user account');
      }

      // Sign in to server to create session
      await signInToServer(userCredential.user);
      
      // Show success message
      toast.success('Account created successfully! Redirecting to dashboard...', {
        position: 'top-right',
        autoClose: 2000
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Email signup error:', error);
      
      let errorMessage = 'An error occurred during signup. Please try again.';
      
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

  // Handle Google signup
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const userCredential = await signInWithGoogle();
      
      if (!userCredential?.user) {
        throw new Error('Failed to sign up with Google');
      }

      // Sign in to server to create session
      await signInToServer(userCredential.user);
      
      // Show success message
      toast.success('Account created successfully! Redirecting to dashboard...', {
        position: 'top-right',
        autoClose: 2000
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.replace('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Google signup error:', error);
      
      let errorMessage = CONSTANTS.errors.defaultMessage;
      
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as AuthError;
        if (authError.code === CONSTANTS.errors.firebase.EMAIL_USED) {
          errorMessage = 'You have already signed up! Please log into your account.';
        } else {
          errorMessage = getAuthErrorMessage(authError);
        }
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
    </>
  );
}
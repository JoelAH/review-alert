'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { validateEmail, EmailValidationResult } from '@/lib/utils/emailValidation';
import { validatePassword, PasswordValidationResult } from '@/lib/utils/passwordValidation';

import { EnhancedAuthError } from '@/lib/utils/authErrorHandler';

export interface EmailAuthFormProps {
  mode: 'signup' | 'login';
  onSubmit: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string | EnhancedAuthError;
  onRetry?: () => void;
  onErrorAction?: (action: () => void) => void;
}

export default function EmailAuthForm({ 
  mode, 
  onSubmit, 
  loading = false, 
  error, 
  onRetry,
  onErrorAction 
}: EmailAuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailValidation, setEmailValidation] = useState<EmailValidationResult | null>(null);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  const isSignup = mode === 'signup';
  const title = isSignup ? 'Create Account' : 'Sign In';
  const submitText = isSignup ? 'Create Account' : 'Sign In';

  // Validate email on change
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = event.target.value;
    setEmail(newEmail);
    
    if (newEmail.trim()) {
      const validation = validateEmail(newEmail);
      setEmailValidation(validation);
    } else {
      setEmailValidation(null);
    }
  };

  // Validate password on change (only for signup)
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = event.target.value;
    setPassword(newPassword);
    
    if (isSignup && newPassword) {
      const validation = validatePassword(newPassword);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation(null);
    }
  };

  // Handle field blur for touched state
  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    if (!email.trim()) {
      setEmailValidation({ isValid: false, isDisposable: false, message: 'Email address is required' });
    }
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    if (isSignup && !password) {
      setPasswordValidation({ 
        isValid: false, 
        strength: 'weak', 
        message: 'Password is required',
        errors: ['Password is required']
      });
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Mark all fields as touched
    setTouched({ email: true, password: true });
    
    // Validate email
    const emailValidationResult = validateEmail(email);
    setEmailValidation(emailValidationResult);
    
    // Validate password for signup
    let passwordValidationResult: PasswordValidationResult | null = null;
    if (isSignup) {
      passwordValidationResult = validatePassword(password);
      setPasswordValidation(passwordValidationResult);
    }
    
    // Check if form is valid
    const isEmailValid = emailValidationResult.isValid;
    const isPasswordValid = isSignup ? passwordValidationResult?.isValid : password.length > 0;
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }
    
    // Submit form
    try {
      await onSubmit(email.trim(), password);
    } catch (error) {
      // Error handling is done by parent component
      console.error('Form submission error:', error);
    }
  };

  // Get email error message
  const getEmailError = () => {
    if (!touched.email || !emailValidation) return '';
    return emailValidation.message || '';
  };

  // Get password error message
  const getPasswordError = () => {
    if (!touched.password || !passwordValidation) return '';
    return passwordValidation.message || '';
  };

  // Check if submit button should be disabled
  const isSubmitDisabled = () => {
    if (loading) return true;
    if (!email.trim() || !password) return true;
    if (emailValidation && !emailValidation.isValid) return true;
    if (isSignup && passwordValidation && !passwordValidation.isValid) return true;
    return false;
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 400 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
        {title}
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            typeof error === 'object' && error.retryable && onRetry ? (
              <Button color="inherit" size="small" onClick={onRetry}>
                Retry
              </Button>
            ) : typeof error === 'object' && error.action && onErrorAction ? (
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => onErrorAction(error.action!.handler)}
              >
                {error.action.text}
              </Button>
            ) : undefined
          }
        >
          {typeof error === 'string' ? error : error.userMessage}
        </Alert>
      )}

      <TextField
        fullWidth
        id="email"
        name="email"
        type="email"
        label="Email Address"
        value={email}
        onChange={handleEmailChange}
        onBlur={handleEmailBlur}
        error={touched.email && emailValidation ? !emailValidation.isValid : false}
        helperText={getEmailError()}
        disabled={loading}
        autoComplete="email"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <EmailIcon color="action" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
        aria-describedby={getEmailError() ? 'email-error' : undefined}
      />

      <TextField
        fullWidth
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        label="Password"
        value={password}
        onChange={handlePasswordChange}
        onBlur={handlePasswordBlur}
        error={touched.password && passwordValidation ? !passwordValidation.isValid : false}
        helperText={getPasswordError()}
        disabled={loading}
        autoComplete={isSignup ? 'new-password' : 'current-password'}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleTogglePasswordVisibility}
                onMouseDown={(e) => e.preventDefault()}
                edge="end"
                disabled={loading}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
        aria-describedby={getPasswordError() ? 'password-error' : undefined}
      />

      {/* Password strength indicator for signup */}
      {isSignup && passwordValidation && password && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Password strength: 
            <Typography 
              component="span" 
              variant="caption" 
              sx={{ 
                ml: 1,
                color: passwordValidation.strength === 'weak' ? 'error.main' :
                       passwordValidation.strength === 'fair' ? 'warning.main' :
                       passwordValidation.strength === 'good' ? 'info.main' : 'success.main',
                fontWeight: 'medium'
              }}
            >
              {passwordValidation.strength.charAt(0).toUpperCase() + passwordValidation.strength.slice(1)}
            </Typography>
          </Typography>
        </Box>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={isSubmitDisabled()}
        sx={{ 
          mb: 2,
          height: 48,
          position: 'relative'
        }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          submitText
        )}
      </Button>
    </Box>
  );
}
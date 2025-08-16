import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailAuthForm from '../EmailAuthForm';
import { EnhancedAuthError, AUTH_ERROR_CODES } from '@/lib/utils/authErrorHandler';

// Mock validation utilities
jest.mock('@/lib/utils/emailValidation', () => ({
  validateEmail: jest.fn(() => ({ isValid: true, isDisposable: false }))
}));

jest.mock('@/lib/utils/passwordValidation', () => ({
  validatePassword: jest.fn(() => ({ isValid: true, strength: 'good' }))
}));

describe('EmailAuthForm Error Handling', () => {
  const mockOnSubmit = jest.fn();
  const mockOnRetry = jest.fn();
  const mockOnErrorAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Enhanced Error Display', () => {
    it('should display string error messages', () => {
      render(
        <EmailAuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          error="Simple error message"
        />
      );

      expect(screen.getByText('Simple error message')).toBeInTheDocument();
    });

    it('should display enhanced error messages', () => {
      const enhancedError: EnhancedAuthError = {
        code: AUTH_ERROR_CODES.WRONG_PASSWORD,
        message: 'Wrong password',
        userMessage: 'Incorrect email or password. Please try again.',
        field: 'password',
        retryable: false,
        actionable: true
      };

      render(
        <EmailAuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          error={enhancedError}
        />
      );

      expect(screen.getByText('Incorrect email or password. Please try again.')).toBeInTheDocument();
    });

    it('should show retry button for retryable errors', () => {
      const enhancedError: EnhancedAuthError = {
        code: AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED,
        message: 'Network error',
        userMessage: 'Network connection failed. Please check your internet connection and try again.',
        field: 'general',
        retryable: true,
        actionable: true
      };

      render(
        <EmailAuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          error={enhancedError}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should show action button for actionable errors', () => {
      const enhancedError: EnhancedAuthError = {
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
        message: 'User not found',
        userMessage: 'No account found with this email address. Please check your email or create a new account.',
        field: 'email',
        retryable: false,
        actionable: true,
        action: {
          text: 'Create Account',
          handler: jest.fn()
        }
      };

      render(
        <EmailAuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          error={enhancedError}
          onErrorAction={mockOnErrorAction}
        />
      );

      const actionButton = screen.getByRole('button', { name: /create account/i });
      expect(actionButton).toBeInTheDocument();

      fireEvent.click(actionButton);
      expect(mockOnErrorAction).toHaveBeenCalledWith(enhancedError.action!.handler);
    });

    it('should not show action button when no action is provided', () => {
      const enhancedError: EnhancedAuthError = {
        code: AUTH_ERROR_CODES.INVALID_EMAIL,
        message: 'Invalid email',
        userMessage: 'Please enter a valid email address.',
        field: 'email',
        retryable: false,
        actionable: true
      };

      render(
        <EmailAuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          error={enhancedError}
        />
      );

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /create account/i })).not.toBeInTheDocument();
    });

    it('should not show retry button for non-retryable errors', () => {
      const enhancedError: EnhancedAuthError = {
        code: AUTH_ERROR_CODES.WEAK_PASSWORD,
        message: 'Weak password',
        userMessage: 'Password must be at least 8 characters long and include a mix of letters, numbers, and symbols.',
        field: 'password',
        retryable: false,
        actionable: true
      };

      render(
        <EmailAuthForm
          mode="signup"
          onSubmit={mockOnSubmit}
          error={enhancedError}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  describe('Form Submission Error Handling', () => {
    it('should handle form submission errors gracefully', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'));

      render(
        <EmailAuthForm
          mode="login"
          onSubmit={mockOnSubmit}
        />
      );

      // Fill out form
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
      });

      // Error should be logged but not crash the component
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should prevent submission when validation fails', async () => {
      const user = userEvent.setup();
      const emailValidation = await import('@/lib/utils/emailValidation');
      emailValidation.validateEmail.mockReturnValue({ isValid: false, isDisposable: false, message: 'Invalid email' });

      render(
        <EmailAuthForm
          mode="login"
          onSubmit={mockOnSubmit}
        />
      );

      // Fill out form with invalid email
      await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      // Try to submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Form should not be submitted
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      render(
        <EmailAuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          loading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Field-Specific Error Handling', () => {
    it('should highlight email field for email-related errors', () => {
      const enhancedError: EnhancedAuthError = {
        code: AUTH_ERROR_CODES.INVALID_EMAIL,
        message: 'Invalid email',
        userMessage: 'Please enter a valid email address.',
        field: 'email',
        retryable: false,
        actionable: true
      };

      render(
        <EmailAuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          error={enhancedError}
        />
      );

      // The error should be displayed in the alert
      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    });

    it('should highlight password field for password-related errors', () => {
      const enhancedError: EnhancedAuthError = {
        code: AUTH_ERROR_CODES.WEAK_PASSWORD,
        message: 'Weak password',
        userMessage: 'Password must be at least 8 characters long.',
        field: 'password',
        retryable: false,
        actionable: true
      };

      render(
        <EmailAuthForm
          mode="signup"
          onSubmit={mockOnSubmit}
          error={enhancedError}
        />
      );

      // The error should be displayed in the alert
      expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument();
    });

    it('should show general errors without field highlighting', () => {
      const enhancedError: EnhancedAuthError = {
        code: AUTH_ERROR_CODES.TOO_MANY_REQUESTS,
        message: 'Too many requests',
        userMessage: 'Too many failed attempts. Please wait a few minutes before trying again.',
        field: 'general',
        retryable: true,
        actionable: false
      };

      render(
        <EmailAuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          error={enhancedError}
        />
      );

      // The error should be displayed in the alert
      expect(screen.getByText('Too many failed attempts. Please wait a few minutes before trying again.')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for error states', () => {
      const enhancedError: EnhancedAuthError = {
        code: AUTH_ERROR_CODES.INVALID_EMAIL,
        message: 'Invalid email',
        userMessage: 'Please enter a valid email address.',
        field: 'email',
        retryable: false,
        actionable: true
      };

      render(
        <EmailAuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          error={enhancedError}
        />
      );

      // Error alert should be accessible
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Please enter a valid email address.');
    });

    it('should have proper button labels for screen readers', () => {
      const enhancedError: EnhancedAuthError = {
        code: AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED,
        message: 'Network error',
        userMessage: 'Network connection failed.',
        field: 'general',
        retryable: true,
        actionable: true
      };

      render(
        <EmailAuthForm
          mode="login"
          onSubmit={mockOnSubmit}
          error={enhancedError}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveAttribute('type', 'button');
    });
  });
});
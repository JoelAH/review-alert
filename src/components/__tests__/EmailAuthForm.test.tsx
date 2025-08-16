import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import EmailAuthForm, { EmailAuthFormProps } from '../EmailAuthForm';

// Create a basic MUI theme for testing
const theme = createTheme();

// Wrapper component with theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

// Mock the validation utilities
jest.mock('@/lib/utils/emailValidation', () => ({
  validateEmail: jest.fn((email: string) => {
    if (!email.trim()) {
      return { isValid: false, isDisposable: false, message: 'Email address is required' };
    }
    if (!email.includes('@')) {
      return { isValid: false, isDisposable: false, message: 'Please enter a valid email address' };
    }
    if (email.includes('mailinator.com')) {
      return { 
        isValid: false, 
        isDisposable: true, 
        message: 'Temporary or disposable email addresses are not allowed. Please use a permanent email address.' 
      };
    }
    return { isValid: true, isDisposable: false };
  })
}));

jest.mock('@/lib/utils/passwordValidation', () => ({
  validatePassword: jest.fn((password: string) => {
    if (!password) {
      return { 
        isValid: false, 
        strength: 'weak', 
        message: 'Password is required',
        errors: ['Password is required']
      };
    }
    if (password.length < 8) {
      return { 
        isValid: false, 
        strength: 'weak', 
        message: 'Password must be at least 8 characters long',
        errors: ['Password must be at least 8 characters long']
      };
    }
    return { 
      isValid: true, 
      strength: 'good', 
      errors: []
    };
  })
}));

describe('EmailAuthForm', () => {
  const defaultProps: EmailAuthFormProps = {
    mode: 'login',
    onSubmit: jest.fn(),
    loading: false,
    error: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form correctly', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} mode="login" />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('should render signup form correctly', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} mode="signup" />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('should display error message when provided', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} error="Test error message" />
        </TestWrapper>
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should show loading state correctly', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} loading={true} />
        </TestWrapper>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeDisabled();
      expect(screen.getByLabelText('Password')).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should validate email on blur', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText('Email Address');
      
      await user.click(emailInput);
      await user.tab(); // Blur the field

      await waitFor(() => {
        expect(screen.getByText('Email address is required')).toBeInTheDocument();
      });
    });

    it('should show email validation error for invalid format', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText('Email Address');
      
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should show disposable email error', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText('Email Address');
      
      await user.type(emailInput, 'test@mailinator.com');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Temporary or disposable email addresses are not allowed. Please use a permanent email address.')).toBeInTheDocument();
      });
    });

    it('should validate password on blur for signup mode', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} mode="signup" />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Password');
      
      await user.click(passwordInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should show password strength indicator for signup', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} mode="signup" />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Password');
      
      await user.type(passwordInput, 'password123');

      await waitFor(() => {
        expect(screen.getByText(/Password strength:/)).toBeInTheDocument();
        expect(screen.getByText('Good')).toBeInTheDocument();
      });
    });

    it('should not show password strength indicator for login', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} mode="login" />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Password');
      
      await user.type(passwordInput, 'password123');

      expect(screen.queryByText(/Password strength:/)).not.toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const toggleButton = screen.getByLabelText('Show password');

      expect(passwordInput.type).toBe('password');

      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

      await user.click(toggleButton);
      expect(passwordInput.type).toBe('password');
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with valid data', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: 'Sign In' });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should not submit with invalid email', async () => {
      const mockOnSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      
      // The submit button should be disabled due to invalid email
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      expect(submitButton).toBeDisabled();
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not submit with invalid password in signup mode', async () => {
      const mockOnSubmit = jest.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} mode="signup" onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123'); // Too short
      
      // The submit button should be disabled due to invalid password
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      expect(submitButton).toBeDisabled();
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should disable submit button when loading', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} loading={true} />
        </TestWrapper>
      );

      // When loading, the button shows a progress indicator and is disabled
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should disable submit button with empty fields', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and descriptions', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const toggleButton = screen.getByLabelText('Show password');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
      expect(passwordInput).toHaveAttribute('required');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should have proper autoComplete attributes for signup', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} mode="signup" />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
      expect(passwordInput).toHaveAttribute('minLength', '8');
    });

    it('should have proper form role and aria-label', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} mode="login" />
        </TestWrapper>
      );

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', 'Sign In form');
    });

    it('should have screen reader announcements', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const announceRegion = screen.getByRole('status');
      expect(announceRegion).toHaveAttribute('aria-live', 'polite');
      expect(announceRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should announce password visibility changes', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const toggleButton = screen.getByLabelText('Show password');
      
      await user.click(toggleButton);
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-pressed', 'true');

      await user.click(toggleButton);
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have proper aria-invalid attributes', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText('Email Address');
      
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have password strength indicator with proper accessibility', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} mode="signup" />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('Password');
      
      await user.type(passwordInput, 'password123');

      await waitFor(() => {
        const strengthIndicator = screen.getByRole('status', { name: 'Password strength indicator' });
        expect(strengthIndicator).toHaveAttribute('aria-live', 'polite');
        expect(screen.getByTestId('password-strength')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const toggleButton = screen.getByTestId('password-visibility-toggle');

      // Tab through form elements
      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(toggleButton).toHaveFocus();

      // Submit button is disabled when form is empty, so it won't receive focus
      // This is correct accessibility behavior
    });

    it('should clear fields with Escape key', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');

      // Clear email with Escape
      await user.click(emailInput);
      await user.keyboard('{Escape}');
      expect(emailInput).toHaveValue('');

      // Clear password with Escape
      await user.click(passwordInput);
      await user.keyboard('{Escape}');
      expect(passwordInput).toHaveValue('');
    });

    it('should have proper loading state accessibility', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} loading={true} />
        </TestWrapper>
      );

      const loadingIndicator = screen.getByLabelText('Submitting form');
      expect(loadingIndicator).toBeInTheDocument();
      
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toHaveAttribute('aria-describedby', 'submit-loading');
    });

    it('should focus first error field when form has errors', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} error="Authentication failed" />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      
      // Trigger validation error
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(emailInput).toHaveFocus();
      });
    });

    it('should have proper test IDs for testing', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-visibility-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });
  });
});
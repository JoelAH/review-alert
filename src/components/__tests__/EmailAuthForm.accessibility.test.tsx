import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { axe, toHaveNoViolations } from 'jest-axe';
import EmailAuthForm, { EmailAuthFormProps } from '../EmailAuthForm';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

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

describe('EmailAuthForm Accessibility', () => {
  const defaultProps: EmailAuthFormProps = {
    mode: 'login',
    onSubmit: jest.fn(),
    loading: false,
    error: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Automated Accessibility Testing', () => {
    it('should not have any accessibility violations in login mode', async () => {
      const { container } = render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} mode="login" />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have any accessibility violations in signup mode', async () => {
      const { container } = render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} mode="signup" />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have any accessibility violations with errors', async () => {
      const { container } = render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} error="Test error message" />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have any accessibility violations in loading state', async () => {
      const { container } = render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} loading={true} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce form state changes', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      const announceRegion = screen.getByRole('status');

      // Trigger validation error
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(announceRegion).toHaveTextContent('Email error: Email address is required');
      });
    });

    it('should announce password strength changes in signup mode', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} mode="signup" />
        </TestWrapper>
      );

      const passwordInput = screen.getByTestId('password-input');

      await user.type(passwordInput, 'password123');
      
      // Trigger blur to activate the announcement
      await user.tab();

      await waitFor(() => {
        const announceRegions = screen.getAllByRole('status');
        const mainAnnounceRegion = announceRegions.find(region => 
          region.textContent?.includes('Password strength is good')
        );
        expect(mainAnnounceRegion).toBeTruthy();
      });
    });

    it('should announce password visibility changes', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('password-visibility-toggle');
      const announceRegion = screen.getByRole('status');

      await user.click(toggleButton);

      await waitFor(() => {
        expect(announceRegion).toHaveTextContent('Password is now visible');
      });

      await user.click(toggleButton);

      await waitFor(() => {
        expect(announceRegion).toHaveTextContent('Password is now hidden');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      // Start from beginning of document
      await user.tab();
      expect(screen.getByTestId('email-input')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('password-input')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('password-visibility-toggle')).toHaveFocus();

      // Submit button is disabled when form is empty, so it won't receive focus
      // This is correct accessibility behavior
    });

    it('should support keyboard shortcuts', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');

      // Type some content
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Test Escape key functionality
      await user.click(emailInput);
      await user.keyboard('{Escape}');
      expect(emailInput).toHaveValue('');

      await user.click(passwordInput);
      await user.keyboard('{Escape}');
      expect(passwordInput).toHaveValue('');
    });
  });

  describe('Focus Management', () => {
    it('should manage focus properly on validation errors', async () => {
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

    it('should maintain focus on password visibility toggle', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const toggleButton = screen.getByTestId('password-visibility-toggle');
      
      // First focus the button, then click it
      toggleButton.focus();
      await user.click(toggleButton);
      
      // The button should still have focus after clicking
      expect(toggleButton).toHaveFocus();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper ARIA attributes on form elements', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const form = screen.getByRole('form');
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const toggleButton = screen.getByTestId('password-visibility-toggle');

      expect(form).toHaveAttribute('aria-label', 'Sign In form');
      expect(emailInput).toHaveAttribute('aria-label', 'Email Address');
      expect(emailInput).toHaveAttribute('aria-invalid', 'false');
      expect(passwordInput).toHaveAttribute('aria-label', 'Password');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false');
      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should update ARIA attributes based on validation state', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      
      // Trigger validation error
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have proper live regions', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const announceRegion = screen.getByRole('status');
      expect(announceRegion).toHaveAttribute('aria-live', 'polite');
      expect(announceRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Form Validation Accessibility', () => {
    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      
      // Trigger validation error
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-describedby');
        const describedBy = emailInput.getAttribute('aria-describedby');
        expect(describedBy).toContain('email');
      });
    });

    it('should provide accessible password strength feedback', async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} mode="signup" />
        </TestWrapper>
      );

      const passwordInput = screen.getByTestId('password-input');
      
      await user.type(passwordInput, 'password123');

      await waitFor(() => {
        const strengthIndicator = screen.getByRole('status', { name: 'Password strength indicator' });
        expect(strengthIndicator).toHaveAttribute('aria-live', 'polite');
        expect(screen.getByTestId('password-strength')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State Accessibility', () => {
    it('should provide accessible loading feedback', () => {
      render(
        <TestWrapper>
          <EmailAuthForm {...defaultProps} loading={true} />
        </TestWrapper>
      );

      const loadingIndicator = screen.getByLabelText('Submitting form');
      const submitButton = screen.getByTestId('submit-button');

      expect(loadingIndicator).toHaveAttribute('role', 'progressbar');
      expect(submitButton).toHaveAttribute('aria-describedby', 'submit-loading');
      expect(submitButton).toBeDisabled();
    });
  });
});
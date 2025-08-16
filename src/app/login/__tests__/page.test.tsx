import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import LoginPage from '../page';
import { signInWithEmail, signInWithGoogle } from '@/lib/firebase/auth';
import { signInToServer } from '@/lib/services/auth';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  ToastContainer: () => <div data-testid="toast-container" />,
}));

jest.mock('@/lib/firebase/auth', () => ({
  signInWithEmail: jest.fn(),
  signInWithGoogle: jest.fn(),
  getAuthErrorMessage: jest.fn((error) => error.message || 'Authentication error'),
}));

jest.mock('@/lib/services/auth', () => ({
  signInToServer: jest.fn(),
}));

jest.mock('@/lib/constants', () => {
  const mockConstants = {
    errors: {
      defaultMessage: 'Error. Something went wrong.',
      firebase: {
        EMAIL_USED: 'auth/email-already-in-use',
        INVALID_CREDENTIAL: 'auth/invalid-credential',
        WRONG_PASSWORD: 'auth/wrong-password',
        EMAIL_NOT_FOUND: 'auth/user-not-found'
      }
    },
  };
  return {
    __esModule: true,
    default: mockConstants,
  };
});

// Mock react-google-button
jest.mock('react-google-button', () => {
  return function GoogleButton({ onClick, disabled, style }: any) {
    return (
      <button
        data-testid="google-login-button"
        onClick={onClick}
        disabled={disabled}
        style={style}
      >
        Sign in with Google
      </button>
    );
  };
});

const mockPush = jest.fn();
const mockReplace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
  });
});

// Helper function to get password input field
const getPasswordInput = () => screen.getByLabelText('Password');

describe('LoginPage', () => {
  it('renders login form with correct title and subtitle', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to continue monitoring your app reviews')).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('renders email form and Google button', () => {
    render(<LoginPage />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
  });

  describe('Email Login', () => {
    it('handles successful email login', async () => {
      const mockUserCredential = {
        user: { uid: 'test-uid', email: 'test@example.com' }
      };

      (signInWithEmail as jest.Mock).mockResolvedValue(mockUserCredential);
      (signInToServer as jest.Mock).mockResolvedValue(undefined);

      render(<LoginPage />);
      
      // Fill in the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(getPasswordInput(), {
        target: { value: 'password123' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));

      await waitFor(() => {
        expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(signInToServer).toHaveBeenCalledWith(mockUserCredential.user);
        expect(toast.success).toHaveBeenCalledWith(
          'Signed in successfully! Redirecting to dashboard...',
          expect.any(Object)
        );
      });

      // Wait for redirect
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 3000 });
    });

    it('handles email login with invalid credentials', async () => {
      const mockError = {
        code: 'auth/wrong-password',
        message: 'Incorrect password'
      };

      (signInWithEmail as jest.Mock).mockRejectedValue(mockError);

      render(<LoginPage />);
      
      // Fill in the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(getPasswordInput(), {
        target: { value: 'wrongpassword' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));

      await waitFor(() => {
        expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
        expect(toast.error).toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });

    it('handles email login with user not found', async () => {
      const mockError = {
        code: 'auth/user-not-found',
        message: 'User not found'
      };

      (signInWithEmail as jest.Mock).mockRejectedValue(mockError);

      render(<LoginPage />);
      
      // Fill in the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'nonexistent@example.com' }
      });
      fireEvent.change(getPasswordInput(), {
        target: { value: 'password123' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));

      await waitFor(() => {
        expect(signInWithEmail).toHaveBeenCalledWith('nonexistent@example.com', 'password123');
        expect(toast.error).toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });

    it('shows loading state during email login', async () => {
      (signInWithEmail as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<LoginPage />);
      
      // Fill in the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(getPasswordInput(), {
        target: { value: 'password123' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));

      // Check that buttons are disabled during loading
      await waitFor(() => {
        expect(screen.getByTestId('google-login-button')).toBeDisabled();
      });
    });
  });

  describe('Google Login', () => {
    it('handles successful Google login', async () => {
      const mockUserCredential = {
        user: { uid: 'google-uid', email: 'test@gmail.com' }
      };

      (signInWithGoogle as jest.Mock).mockResolvedValue(mockUserCredential);
      (signInToServer as jest.Mock).mockResolvedValue(undefined);

      render(<LoginPage />);
      
      // Click Google login button
      fireEvent.click(screen.getByTestId('google-login-button'));

      await waitFor(() => {
        expect(signInWithGoogle).toHaveBeenCalled();
        expect(signInToServer).toHaveBeenCalledWith(mockUserCredential.user);
        expect(toast.success).toHaveBeenCalledWith(
          'Signed in successfully! Redirecting to dashboard...',
          expect.any(Object)
        );
      });

      // Wait for redirect
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 3000 });
    });

    it('handles Google login error', async () => {
      const mockError = {
        code: 'auth/popup-closed-by-user',
        message: 'Popup closed by user'
      };

      (signInWithGoogle as jest.Mock).mockRejectedValue(mockError);

      render(<LoginPage />);
      
      // Click Google login button
      fireEvent.click(screen.getByTestId('google-login-button'));

      await waitFor(() => {
        expect(signInWithGoogle).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });

    it('shows loading state during Google login', async () => {
      (signInWithGoogle as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<LoginPage />);
      
      // Click Google login button
      fireEvent.click(screen.getByTestId('google-login-button'));

      // Check that buttons are disabled during loading
      expect(screen.getByTestId('google-login-button')).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('has correct link to signup page', () => {
      render(<LoginPage />);
      
      const signupLink = screen.getByRole('link', { name: /sign up/i });
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when login fails', async () => {
      const mockError = {
        code: 'auth/network-request-failed',
        message: 'Network error'
      };

      (signInWithEmail as jest.Mock).mockRejectedValue(mockError);

      render(<LoginPage />);
      
      // Fill in the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(getPasswordInput(), {
        target: { value: 'password123' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('handles server sign-in failure', async () => {
      const mockUserCredential = {
        user: { uid: 'test-uid', email: 'test@example.com' }
      };

      (signInWithEmail as jest.Mock).mockResolvedValue(mockUserCredential);
      (signInToServer as jest.Mock).mockRejectedValue(new Error('Server error'));

      render(<LoginPage />);
      
      // Fill in the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(getPasswordInput(), {
        target: { value: 'password123' }
      });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign in$/i }));

      await waitFor(() => {
        expect(signInWithEmail).toHaveBeenCalled();
        expect(signInToServer).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<LoginPage />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });
  });
});
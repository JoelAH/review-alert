import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import SignupPage from '../page';
import { signUpWithEmail, signInWithGoogle, getAuthErrorMessage } from '@/lib/firebase/auth';
import { signInToServer } from '@/lib/services/auth';
import { AuthError } from 'firebase/auth';

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
  signUpWithEmail: jest.fn(),
  signInWithGoogle: jest.fn(),
  getAuthErrorMessage: jest.fn(),
}));

jest.mock('@/lib/services/auth', () => ({
  signInToServer: jest.fn(),
}));

jest.mock('react-google-button', () => {
  return function GoogleButton({ onClick, disabled, style }: any) {
    return (
      <button
        data-testid="google-signup-button"
        onClick={onClick}
        disabled={disabled}
        style={style}
      >
        Sign up with Google
      </button>
    );
  };
});

// Mock components
jest.mock('@/components/AuthPageLayout', () => {
  return function AuthPageLayout({ children, title, subtitle, alternateAction }: any) {
    return (
      <div data-testid="auth-page-layout">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div>{children}</div>
        <a href={alternateAction.href}>{alternateAction.linkText}</a>
      </div>
    );
  };
});

jest.mock('@/components/EmailAuthForm', () => {
  return function EmailAuthForm({ mode, onSubmit, loading, error }: any) {
    return (
      <div data-testid="email-auth-form">
        <p>Mode: {mode}</p>
        {error && <div data-testid="form-error">{error}</div>}
        <button
          data-testid="email-submit-button"
          onClick={() => onSubmit('test@example.com', 'password123')}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Create Account'}
        </button>
      </div>
    );
  };
});

describe('SignupPage', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    
    // Mock successful responses by default
    (signUpWithEmail as jest.Mock).mockResolvedValue({
      user: { uid: 'test-uid', email: 'test@example.com' }
    });
    (signInWithGoogle as jest.Mock).mockResolvedValue({
      user: { uid: 'test-uid', email: 'test@example.com' }
    });
    (signInToServer as jest.Mock).mockResolvedValue({});
  });

  it('renders signup page with correct layout and components', () => {
    render(<SignupPage />);

    expect(screen.getByTestId('auth-page-layout')).toBeInTheDocument();
    expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    expect(screen.getByText('Start monitoring your app reviews across multiple stores')).toBeInTheDocument();
    expect(screen.getByTestId('email-auth-form')).toBeInTheDocument();
    expect(screen.getByText('Mode: signup')).toBeInTheDocument();
    expect(screen.getByTestId('google-signup-button')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('handles successful email signup', async () => {
    render(<SignupPage />);

    const emailSubmitButton = screen.getByTestId('email-submit-button');
    fireEvent.click(emailSubmitButton);

    await waitFor(() => {
      expect(signUpWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    await waitFor(() => {
      expect(signInToServer).toHaveBeenCalledWith({
        uid: 'test-uid',
        email: 'test@example.com'
      });
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Account created successfully! Redirecting to dashboard...',
      expect.any(Object)
    );

    // Wait for redirect timeout
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    }, { timeout: 3000 });
  });

  it('handles email signup error', async () => {
    const mockError: AuthError = {
      code: 'auth/email-already-in-use',
      message: 'Email already in use',
      name: 'FirebaseError'
    };

    (signUpWithEmail as jest.Mock).mockRejectedValue(mockError);
    (getAuthErrorMessage as jest.Mock).mockReturnValue('An account with this email address already exists. Please sign in instead.');

    render(<SignupPage />);

    const emailSubmitButton = screen.getByTestId('email-submit-button');
    fireEvent.click(emailSubmitButton);

    await waitFor(() => {
      expect(getAuthErrorMessage).toHaveBeenCalledWith(mockError);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'An account with this email address already exists. Please sign in instead.',
        expect.any(Object)
      );
    });

    expect(screen.getByTestId('form-error')).toHaveTextContent(
      'An account with this email address already exists. Please sign in instead.'
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('handles successful Google signup', async () => {
    render(<SignupPage />);

    const googleButton = screen.getByTestId('google-signup-button');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(signInToServer).toHaveBeenCalledWith({
        uid: 'test-uid',
        email: 'test@example.com'
      });
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Account created successfully! Redirecting to dashboard...',
      expect.any(Object)
    );

    // Wait for redirect timeout
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    }, { timeout: 3000 });
  });

  it('handles Google signup error with email already in use', async () => {
    const mockError: AuthError = {
      code: 'auth/email-already-in-use',
      message: 'Email already in use',
      name: 'FirebaseError'
    };

    (signInWithGoogle as jest.Mock).mockRejectedValue(mockError);

    render(<SignupPage />);

    const googleButton = screen.getByTestId('google-signup-button');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'You have already signed up! Please log into your account.',
        expect.any(Object)
      );
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('handles Google signup with other Firebase error', async () => {
    const mockError: AuthError = {
      code: 'auth/network-request-failed',
      message: 'Network error',
      name: 'FirebaseError'
    };

    (signInWithGoogle as jest.Mock).mockRejectedValue(mockError);
    (getAuthErrorMessage as jest.Mock).mockReturnValue('Network error. Please check your connection and try again.');

    render(<SignupPage />);

    const googleButton = screen.getByTestId('google-signup-button');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(getAuthErrorMessage).toHaveBeenCalledWith(mockError);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Network error. Please check your connection and try again.',
        expect.any(Object)
      );
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('handles server sign-in failure after successful Firebase signup', async () => {
    (signInToServer as jest.Mock).mockRejectedValue(new Error('Server error'));

    render(<SignupPage />);

    const emailSubmitButton = screen.getByTestId('email-submit-button');
    fireEvent.click(emailSubmitButton);

    await waitFor(() => {
      expect(signUpWithEmail).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'An error occurred during signup. Please try again.',
        expect.any(Object)
      );
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('disables buttons during loading states', async () => {
    render(<SignupPage />);

    const emailSubmitButton = screen.getByTestId('email-submit-button');
    const googleButton = screen.getByTestId('google-signup-button');

    // Click email button to start loading
    fireEvent.click(emailSubmitButton);

    // Both buttons should be disabled during email loading
    await waitFor(() => {
      expect(emailSubmitButton).toHaveTextContent('Loading...');
      expect(googleButton).toBeDisabled();
    });
  });

  it('handles missing user from Firebase response', async () => {
    (signUpWithEmail as jest.Mock).mockResolvedValue({ user: null });

    render(<SignupPage />);

    const emailSubmitButton = screen.getByTestId('email-submit-button');
    fireEvent.click(emailSubmitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'An error occurred during signup. Please try again.',
        expect.any(Object)
      );
    });

    expect(signInToServer).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('displays toast container', () => {
    render(<SignupPage />);
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
  });

  it('shows correct alternate action link', () => {
    render(<SignupPage />);
    const signInLink = screen.getByText('Sign in');
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login');
  });
});
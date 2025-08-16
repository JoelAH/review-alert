import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import GoogleAuthButton from '../GoogleAuthButton';
import { handleGoogleSignIn } from '@/lib/utils/authHandlers';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/lib/utils/authHandlers');
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn()
  },
  ToastContainer: () => <div data-testid="toast-container" />
}));

// Mock react-google-button
jest.mock('react-google-button', () => {
  return function MockGoogleButton({ onClick, style }: any) {
    return (
      <button 
        onClick={onClick} 
        style={style}
        data-testid="google-button"
      >
        Sign in with Google
      </button>
    );
  };
});

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockHandleGoogleSignIn = handleGoogleSignIn as jest.MockedFunction<typeof handleGoogleSignIn>;

describe('GoogleAuthButton', () => {
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = {
      replace: jest.fn()
    };
    mockUseRouter.mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  it('should render Google button with default styling', () => {
    render(<GoogleAuthButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should render ToastContainer by default', () => {
    render(<GoogleAuthButton />);
    
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
  });

  it('should not render ToastContainer when showToast is false', () => {
    render(<GoogleAuthButton showToast={false} />);
    
    expect(screen.queryByTestId('toast-container')).not.toBeInTheDocument();
  });

  it('should call handleGoogleSignIn when button is clicked', async () => {
    render(<GoogleAuthButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockHandleGoogleSignIn).toHaveBeenCalledWith(mockRouter, {
        redirectTo: '/dashboard',
        onError: expect.any(Function)
      });
    });
  });

  it('should use custom redirectTo path', async () => {
    render(<GoogleAuthButton redirectTo="/custom-path" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockHandleGoogleSignIn).toHaveBeenCalledWith(mockRouter, {
        redirectTo: '/custom-path',
        onError: expect.any(Function)
      });
    });
  });

  it('should handle authentication errors', async () => {
    const mockError = { message: 'Test error', code: 'test-error' };
    
    mockHandleGoogleSignIn.mockImplementation((router, options) => {
      options?.onError?.(mockError);
      return Promise.resolve();
    });

    render(<GoogleAuthButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockHandleGoogleSignIn).toHaveBeenCalled();
    });
  });

  it('should apply custom styling', () => {
    const customStyle = { backgroundColor: 'red', margin: '10px' };
    render(<GoogleAuthButton style={customStyle} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveStyle('background-color: rgb(255, 0, 0)');
    expect(button).toHaveStyle('margin: 10px');
  });
});
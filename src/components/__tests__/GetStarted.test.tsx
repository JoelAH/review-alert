import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import GetStarted from '../getStarted';
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

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  Button: ({ children, onClick, variant, color, size, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={`MuiButton-${variant} MuiButton-color${color?.charAt(0).toUpperCase() + color?.slice(1)} MuiButton-size${size?.charAt(0).toUpperCase() + size?.slice(1)}`}
      {...props}
    >
      {children}
    </button>
  )
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockHandleGoogleSignIn = handleGoogleSignIn as jest.MockedFunction<typeof handleGoogleSignIn>;

describe('GetStarted', () => {
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = {
      replace: jest.fn()
    };
    mockUseRouter.mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  it('should render button with default text', () => {
    render(<GetStarted />);
    
    expect(screen.getByRole('button', { name: 'Get Started Now' })).toBeInTheDocument();
  });

  it('should render button with custom text', () => {
    render(<GetStarted>Custom Button Text</GetStarted>);
    
    expect(screen.getByRole('button', { name: 'Custom Button Text' })).toBeInTheDocument();
  });

  it('should render ToastContainer by default', () => {
    render(<GetStarted />);
    
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
  });

  it('should not render ToastContainer when showToast is false', () => {
    render(<GetStarted showToast={false} />);
    
    expect(screen.queryByTestId('toast-container')).not.toBeInTheDocument();
  });

  it('should call handleGoogleSignIn when button is clicked', async () => {
    render(<GetStarted />);
    
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
    render(<GetStarted redirectTo="/custom-dashboard" />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockHandleGoogleSignIn).toHaveBeenCalledWith(mockRouter, {
        redirectTo: '/custom-dashboard',
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

    render(<GetStarted />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockHandleGoogleSignIn).toHaveBeenCalled();
    });
  });

  it('should apply custom button props', () => {
    render(
      <GetStarted 
        variant="outlined" 
        color="secondary" 
        size="small"
      >
        Custom Text
      </GetStarted>
    );
    
    const button = screen.getByRole('button', { name: 'Custom Text' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('MuiButton-outlined');
    expect(button).toHaveClass('MuiButton-colorSecondary');
    expect(button).toHaveClass('MuiButton-sizeSmall');
  });
});
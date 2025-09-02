import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary, { withErrorBoundary } from '../ErrorBoundary';

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalError;
});

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>No error</div>;
};

describe('ErrorBoundary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render children when there is no error', () => {
        render(
            <ErrorBoundary>
                <div>Test content</div>
            </ErrorBoundary>
        );

        expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render error fallback when child component throws', () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should render custom fallback when provided', () => {
        const customFallback = <div>Custom error message</div>;

        render(
            <ErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Custom error message')).toBeInTheDocument();
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
        const onError = jest.fn();

        render(
            <ErrorBoundary onError={onError}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(onError).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                componentStack: expect.any(String),
            })
        );
    });

    it('should reset error state when retry button is clicked', () => {
        const TestComponent = () => {
            const [shouldThrow, setShouldThrow] = React.useState(true);

            React.useEffect(() => {
                // Reset error after a short delay to simulate fix
                const timer = setTimeout(() => setShouldThrow(false), 100);
                return () => clearTimeout(timer);
            }, []);

            return <ThrowError shouldThrow={shouldThrow} />;
        };

        render(
            <ErrorBoundary>
                <TestComponent />
            </ErrorBoundary>
        );

        // Error should be displayed initially
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();

        // Click retry button
        fireEvent.click(screen.getByRole('button', { name: /try again/i }));

        // Wait for component to re-render without error
        setTimeout(() => {
            expect(screen.getByText('No error')).toBeInTheDocument();
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
        }, 150);
    });

    it('should show error details in development mode', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Development Error Details')).toBeInTheDocument();
        expect(screen.getByText(/Test error/)).toBeInTheDocument();

        process.env.NODE_ENV = originalEnv;
    });

    it('should not show error details in production mode', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.queryByText('Development Error Details')).not.toBeInTheDocument();

        process.env.NODE_ENV = originalEnv;
    });
});

describe('withErrorBoundary HOC', () => {
    it('should wrap component with error boundary', () => {
        const TestComponent = () => <div>Test component</div>;
        const WrappedComponent = withErrorBoundary(TestComponent);

        render(<WrappedComponent />);

        expect(screen.getByText('Test component')).toBeInTheDocument();
    });

    it('should handle errors in wrapped component', () => {
        const WrappedComponent = withErrorBoundary(ThrowError);

        render(<WrappedComponent shouldThrow={true} />);

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should use custom fallback and error handler', () => {
        const customFallback = <div>Custom HOC fallback</div>;
        const onError = jest.fn();
        const WrappedComponent = withErrorBoundary(ThrowError, customFallback, onError);

        render(<WrappedComponent shouldThrow={true} />);

        expect(screen.getByText('Custom HOC fallback')).toBeInTheDocument();
        expect(onError).toHaveBeenCalled();
    });
});
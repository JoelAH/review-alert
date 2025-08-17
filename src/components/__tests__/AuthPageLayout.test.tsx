import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import AuthPageLayout, { AuthPageLayoutProps } from '../AuthPageLayout';

// Create a basic MUI theme for testing
const theme = createTheme();

// Wrapper component with theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider theme={theme}>
        {children}
    </ThemeProvider>
);

// Mock Next.js Link component
jest.mock('next/link', () => {
    const MockLink = React.forwardRef<HTMLAnchorElement, any>(({ children, href, passHref, legacyBehavior, ...props }, ref) => {
        if (passHref && legacyBehavior) {
            return React.cloneElement(children, { href, ref, ...props });
        }
        return (
            <a href={href} ref={ref} {...props}>
                {children}
            </a>
        );
    });
    MockLink.displayName = 'MockLink';
    return MockLink;
});

describe('AuthPageLayout', () => {
    const defaultProps: AuthPageLayoutProps = {
        title: 'Test Title',
        children: <div>Test Content</div>,
        alternateAction: {
            text: 'Already have an account?',
            linkText: 'Sign in',
            href: '/login'
        }
    };

    describe('Rendering', () => {
        it('should render with required props', () => {
            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByRole('heading', { name: 'Review Alert' })).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: 'Test Title' })).toBeInTheDocument();
            expect(screen.getByText('Test Content')).toBeInTheDocument();
            expect(screen.getByText('Already have an account?')).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
        });

        it('should render with subtitle when provided', () => {
            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps} subtitle="Test subtitle" />
                </TestWrapper>
            );

            expect(screen.getByText('Test subtitle')).toBeInTheDocument();
        });

        it('should not render subtitle when not provided', () => {
            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.queryByText('Test subtitle')).not.toBeInTheDocument();
        });
    });

    describe('Branding', () => {
        it('should display Review Alert branding', () => {
            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByRole('heading', { name: 'Review Alert' })).toBeInTheDocument();
            expect(screen.getByText('Monitor reviews across multiple app stores')).toBeInTheDocument();
        });
    });

    describe('Navigation Links', () => {
        it('should render alternate action link with correct href', () => {
            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps} />
                </TestWrapper>
            );

            const signInLink = screen.getByRole('link', { name: 'Sign in' });
            expect(signInLink).toHaveAttribute('href', '/login');
        });

        it('should render footer links', () => {
            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps} />
                </TestWrapper>
            );

            const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });
            const termsLink = screen.getByRole('link', { name: 'Terms of Service' });

            expect(privacyLink).toHaveAttribute('href', '/privacy');
            expect(termsLink).toHaveAttribute('href', '/terms');
        });

        it('should render different alternate action text and link', () => {
            const customProps = {
                ...defaultProps,
                alternateAction: {
                    text: "Don't have an account?",
                    linkText: 'Sign up',
                    href: '/signup'
                }
            };

            render(
                <TestWrapper>
                    <AuthPageLayout {...customProps} />
                </TestWrapper>
            );

            expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
            const signUpLink = screen.getByRole('link', { name: 'Sign up' });
            expect(signUpLink).toHaveAttribute('href', '/signup');
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading hierarchy', () => {
            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps} />
                </TestWrapper>
            );

            const mainHeading = screen.getByRole('heading', { name: 'Test Title', level: 1 });
            expect(mainHeading).toBeInTheDocument();
        });

        it('should have skip to main content link', () => {
            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps} />
                </TestWrapper>
            );

            const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
            expect(skipLink).toHaveAttribute('href', '#main-content');
        });

        it('should have main content area with proper id', () => {
            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps} />
                </TestWrapper>
            );

            const mainContent = screen.getByRole('main');
            expect(mainContent).toBeInTheDocument();

            // Check that the main content area has the id for skip link
            const mainContentWithId = document.getElementById('main-content');
            expect(mainContentWithId).toBeInTheDocument();
        });

        it('should have proper semantic structure', () => {
            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByRole('main')).toBeInTheDocument();
            expect(screen.getAllByRole('heading')).toHaveLength(2); // Review Alert (h2) + page title (h1)
            expect(screen.getAllByRole('link')).toHaveLength(4); // Skip link + alternate action + privacy + terms
        });
    });

    describe('Content Rendering', () => {
        it('should render children content correctly', () => {
            const customChildren = (
                <div>
                    <p>Custom form content</p>
                    <button>Submit</button>
                </div>
            );

            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps}>
                        {customChildren}
                    </AuthPageLayout>
                </TestWrapper>
            );

            expect(screen.getByText('Custom form content')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
        });

        it('should handle complex children components', () => {
            const ComplexChild = () => (
                <form>
                    <input type="email" placeholder="Email" />
                    <input type="password" placeholder="Password" />
                    <button type="submit">Login</button>
                </form>
            );

            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps}>
                        <ComplexChild />
                    </AuthPageLayout>
                </TestWrapper>
            );

            expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
        });
    });

    describe('Responsive Design', () => {
        it('should render without errors on different screen sizes', () => {
            // This test ensures the component renders without throwing errors
            // The actual responsive behavior would be tested with visual regression tests
            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps} />
                </TestWrapper>
            );

            expect(screen.getByRole('main')).toBeInTheDocument();
        });
    });

    describe('Theme Integration', () => {
        it('should render with MUI theme provider', () => {
            // This test ensures the component works with MUI theming
            render(
                <TestWrapper>
                    <AuthPageLayout {...defaultProps} />
                </TestWrapper>
            );

            // Check that MUI components are rendered (they would fail without proper theme)
            expect(screen.getByRole('main')).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: 'Review Alert' })).toBeInTheDocument();
        });
    });
});
'use client';
import { createTheme } from '@mui/material/styles';
import { Lato } from 'next/font/google';

const lato = Lato({
    weight: ['400', '700'],
    style: ['italic', 'normal'],
    subsets: ['latin']
  })

// Create a theme instance.
const theme = createTheme({
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
        },
    },
    typography: {
        fontFamily: lato.style.fontFamily,
        // Responsive typography
        h1: {
            fontSize: '2.5rem',
            '@media (min-width:600px)': {
                fontSize: '3rem',
            },
            '@media (min-width:900px)': {
                fontSize: '3.5rem',
            },
        },
        h2: {
            fontSize: '2rem',
            '@media (min-width:600px)': {
                fontSize: '2.5rem',
            },
            '@media (min-width:900px)': {
                fontSize: '3rem',
            },
        },
        h3: {
            fontSize: '1.75rem',
            '@media (min-width:600px)': {
                fontSize: '2rem',
            },
            '@media (min-width:900px)': {
                fontSize: '2.25rem',
            },
        },
        h4: {
            fontSize: '1.5rem',
            '@media (min-width:600px)': {
                fontSize: '1.75rem',
            },
        },
        h5: {
            fontSize: '1.25rem',
            '@media (min-width:600px)': {
                fontSize: '1.5rem',
            },
        },
        h6: {
            fontSize: '1rem',
            '@media (min-width:600px)': {
                fontSize: '1.125rem',
            },
            '@media (min-width:900px)': {
                fontSize: '1.25rem',
            },
        },
        body1: {
            fontSize: '0.875rem',
            '@media (min-width:600px)': {
                fontSize: '1rem',
            },
        },
        body2: {
            fontSize: '0.75rem',
            '@media (min-width:600px)': {
                fontSize: '0.875rem',
            },
        },
    },
    components: {
        // Enhanced button component for better touch targets
        MuiButton: {
            styleOverrides: {
                root: {
                    minHeight: 44, // Minimum touch target size
                    '@media (max-width:599px)': {
                        minHeight: 48, // Larger touch targets on mobile
                        fontSize: '1rem',
                    },
                },
                sizeLarge: {
                    minHeight: 48,
                    '@media (max-width:599px)': {
                        minHeight: 56,
                        fontSize: '1.1rem',
                        padding: '12px 24px',
                    },
                },
            },
        },
        // Enhanced card component for better mobile experience
        MuiCard: {
            styleOverrides: {
                root: {
                    '@media (max-width:599px)': {
                        margin: '8px 0',
                    },
                },
            },
        },
        // Enhanced container for better responsive behavior
        MuiContainer: {
            styleOverrides: {
                root: {
                    '@media (max-width:599px)': {
                        paddingLeft: 16,
                        paddingRight: 16,
                    },
                },
            },
        },
    },
    palette: {
        primary: {
            main: '#3A6EA5',
        },
        secondary: {
            main: '#FF6B6B',
        },
        error: {
            main: '#eb445a',
        },
        success: {
            main: '#34C759',
        },
        warning: {
            main: '#d18800',
        },
        info: {
            main: '#222428'
        }
    },
});

export default theme;

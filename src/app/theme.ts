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
    typography: {
        fontFamily: lato.style.fontFamily
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

import type { Metadata } from "next";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import "./globals.scss";
import theme from './theme';
import { ThemeProvider } from "@mui/material/styles";
import { Lato } from 'next/font/google';

const lato = Lato({
    weight: ['400', '700'],
    style: ['italic', 'normal'],
    subsets: ['latin']
  })

export const metadata: Metadata = {
  title: 'App Reviews Alert',
  description: 'Get alert when there is a new review on Chrome Store, Google Play or Apple Store'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <body className={lato.className}>
            {children}
          </body>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </html>
  );
}

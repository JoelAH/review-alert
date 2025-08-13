import type { Metadata } from "next";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import "./globals.scss";
import theme from './theme';
import { ThemeProvider } from "@mui/material/styles";
import { Lato } from 'next/font/google';
import Script from 'next/script';

const lato = Lato({
    weight: ['400', '700'],
    style: ['italic', 'normal'],
    subsets: ['latin']
  })

export const metadata: Metadata = {
  metadataBase: new URL('https://reviewalert.app'),
  title: 'Review Alert - AI-Powered App Review Aggregation & Notifications',
  description: 'Aggregate and monitor app reviews from Chrome Web Store, Google Play, and App Store. Get smart notifications, AI sentiment analysis, and gamified task management for solo entrepreneurs and developers.',
  keywords: 'app reviews, review monitoring, Chrome Web Store, Google Play, App Store, AI sentiment analysis, review aggregation, developer tools, app analytics',
  authors: [{ name: 'Review Alert Team' }],
  creator: 'Review Alert',
  publisher: 'Review Alert',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://reviewalert.app',
    siteName: 'Review Alert',
    title: 'Review Alert - AI-Powered App Review Aggregation & Notifications',
    description: 'Aggregate and monitor app reviews from Chrome Web Store, Google Play, and App Store. Get smart notifications, AI sentiment analysis, and gamified task management.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Review Alert - AI-Powered App Review Management'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Review Alert - AI-Powered App Review Aggregation',
    description: 'Monitor app reviews across Chrome Web Store, Google Play, and App Store with AI-powered insights and gamification.',
    images: ['/twitter-image.jpg']
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3A6EA5'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Review Alert",
    "description": "AI-powered app review aggregation and notification system for developers and entrepreneurs",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "creator": {
      "@type": "Organization",
      "name": "Review Alert Team"
    },
    "featureList": [
      "App review aggregation from Chrome Web Store, Google Play, and App Store",
      "AI-powered sentiment analysis",
      "Smart notifications and alerts",
      "Gamified task management",
      "Multi-store support"
    ]
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#3A6EA5" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <body className={lato.className}>
            <Script
              id="structured-data"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(structuredData)
              }}
            />
            <Script
              id="performance-monitoring"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  // Initialize performance monitoring
                  if (typeof window !== 'undefined') {
                    import('/src/lib/utils/performance.js').then(module => {
                      module.initPerformanceMonitoring();
                    }).catch(() => {
                      console.log('Performance monitoring not available');
                    });
                  }
                `
              }}
            />
            <div id="__next">
              {children}
            </div>
            <div id="modal-root" />
          </body>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </html>
  );
}

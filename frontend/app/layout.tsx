import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Syne } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';

// ==========================================
// Font Configuration
// ==========================================
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

// ==========================================
// Metadata
// ==========================================
export const metadata: Metadata = {
  title: {
    default: 'FoodLink — Smart Food Redistribution Platform',
    template: '%s | FoodLink',
  },
  description:
    'FoodLink connects hotels and restaurants with NGOs and volunteers to redistribute surplus food and fight hunger. Reduce food waste, save meals.',
  keywords: [
    'food redistribution',
    'food donation',
    'NGO',
    'food waste',
    'hunger',
    'volunteers',
    'sustainability',
    'FoodLink',
  ],
  authors: [{ name: 'FoodLink Team' }],
  creator: 'FoodLink',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://foodlink.app',
    siteName: 'FoodLink',
    title: 'FoodLink — Smart Food Redistribution Platform',
    description:
      'Connecting surplus food with hungry communities. Join the movement.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FoodLink — Smart Food Redistribution Platform',
    description: 'Connecting surplus food with hungry communities.',
    creator: '@foodlinkapp',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#166534' },
    { media: '(prefers-color-scheme: dark)', color: '#0a140a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// ==========================================
// Root Layout
// ==========================================
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${syne.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            gutter={8}
            containerStyle={{ top: 20, right: 20 }}
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: 'var(--font-jakarta)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                padding: '12px 16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              },
              success: {
                iconTheme: { primary: '#16a34a', secondary: '#ffffff' },
                style: {
                  background: '#f0fdf4',
                  color: '#14532d',
                  border: '1px solid #bbf7d0',
                },
              },
              error: {
                iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
                style: {
                  background: '#fef2f2',
                  color: '#7f1d1d',
                  border: '1px solid #fecaca',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

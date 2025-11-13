import "@/app/globals.css"
import { Inter as FontSans } from "next/font/google"

import { ThemeProvider } from "@/components/shared/theme-provider"
import { SupabaseProvider, AuthProvider } from "@/features/auth"
import { ViewportProvider } from "@/components/providers/ViewportProvider"
import { cn } from "@/lib/utils"
import { Footer } from "@/components/layout/Footer"
import { Toaster } from "@/components/shared/toaster"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://midas-agency.com'),
  title: {
    template: '%s | MIDAS Agency',
    default: 'MIDAS - Digital Marketing & Technology Solutions Agency'
  },
  description: "Transform your business with MIDAS digital marketing and technology solutions. Specializing in automation, branding, video production, IT systems, and performance marketing.",
  keywords: [
    'digital marketing agency',
    'technology solutions',
    'business automation',
    'brand development',
    'video production',
    'IT systems',
    'performance marketing',
    'KOL endorsement',
    'marketing strategy',
    'digital transformation'
  ],
  authors: [{ name: 'MIDAS Agency' }],
  creator: 'MIDAS Agency',
  publisher: 'MIDAS Agency',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'MIDAS Agency',
    title: 'MIDAS - Digital Marketing & Technology Solutions Agency',
    description: 'Transform your business with MIDAS digital marketing and technology solutions.',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@midasagency',
    site: '@midasagency',
  },
  category: 'Digital Marketing Agency',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background text-foreground font-sans antialiased flex flex-col",
          fontSans.variable
        )}
      >
        <ViewportProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <AuthProvider>
              <SupabaseProvider>
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
                <Toaster />
              </SupabaseProvider>
            </AuthProvider>
          </ThemeProvider>
        </ViewportProvider>
      </body>
    </html>
  )
}

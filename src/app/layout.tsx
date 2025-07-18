import "@/app/globals.css"
import { Inter as FontSans } from "next/font/google"

import { ThemeProvider } from "@/components/shared/theme-provider"
import { SupabaseProvider } from "@/lib/providers/SupabaseProvider"
import { AuthProvider } from "@/lib/providers/AuthProvider"
import { cn } from "@/lib/utils"
import { Footer } from "@/components/layout/Footer"
import { Toaster } from "@/components/shared/toaster"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata = {
  title: "MIDAS - Marketing & Digital Agency",
  description: "MIDAS is a full-service marketing and digital agency specializing in brand development, digital marketing, and technology solutions.",
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
      </body>
    </html>
  )
}

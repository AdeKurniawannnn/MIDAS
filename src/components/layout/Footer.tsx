import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-8">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="accent-text font-bold text-xl">MIDAS</span>
            <p className="text-muted-foreground text-sm mt-1">Your partner in digital transformation</p>
          </div>
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} MIDAS. All rights reserved.
        </div>
      </div>
    </footer>
  )
} 
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Keywords Management | MIDAS Orion",
  description: "Manage your keywords for Instagram and Google Maps scraping automation",
}

export default function KeywordsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="keywords-layout">
      {children}
    </div>
  )
}
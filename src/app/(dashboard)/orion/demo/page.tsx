import { ProtectedRoute } from "@/features/auth"
import { ScrapingFormDemo } from "@/features/orion/components/scraping-form-demo"

export const metadata = {
  title: 'Scraping Form Demo',
  description: 'Compare the original complex scraping form with the new simplified version.',
}

export default function DemoPage() {
  return (
    <ProtectedRoute>
      <ScrapingFormDemo />
    </ProtectedRoute>
  )
}
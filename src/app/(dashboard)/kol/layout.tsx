"use client"

import { ReactNode } from "react"

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic'
export const revalidate = 0
import UnifiedDashboardLayout from "@/components/features/dashboard/unified-dashboard-layout"

interface DashboardPageProps {
  children: ReactNode
}

export default function KolLayout({ children }: DashboardPageProps) {
  return (
    <UnifiedDashboardLayout currentPage="KOL" showSidebar={true} showBreadcrumbs={true}>
      {children}
    </UnifiedDashboardLayout>
  )
}

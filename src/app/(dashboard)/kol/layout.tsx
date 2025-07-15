"use client"

import { ReactNode } from "react"
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

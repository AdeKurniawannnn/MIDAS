"use client"

import { ReactNode } from "react"
import UnifiedDashboardLayout from "@/components/features/dashboard/unified-dashboard-layout"

interface DashboardPageProps {
  children: ReactNode
}

export default function OrionLayout({ children }: DashboardPageProps) {
  return (
    <UnifiedDashboardLayout currentPage="Orion" showSidebar={true} showBreadcrumbs={true}>
      {children}
    </UnifiedDashboardLayout>
  )
}

import { ChartAreaInteractive } from "@/components/features/dashboard/chart-area-interactive"
import { DataTable } from "@/components/features/dashboard/data-table"
import { UserWelcome } from "@/components/features/auth/user-welcome"
import { ProtectedRoute } from "@/components/features/auth/protected-route"

import data from "./data.json"

// Force dynamic rendering to handle environment variables
export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* User Welcome Section */}
        <UserWelcome />
        
        {/* Chart Section */}
        <ChartAreaInteractive />
        
        {/* Data Table Section - Scrollable */}
        <div className="max-h-96 overflow-y-auto rounded-lg border bg-card">
          <DataTable data={data} />
        </div>
      </div>
    </ProtectedRoute>
  )
}

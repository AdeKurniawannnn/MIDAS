import KolTable from "@/components/features/kol/kol-table"
import { ProtectedRoute } from "@/components/features/auth/protected-route"

// Force dynamic rendering to handle environment variables
export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <ProtectedRoute>
      <div className="max-h-96 overflow-y-auto rounded-lg border bg-card p-2 shadow-sm w-full">
        <KolTable />
      </div>
    </ProtectedRoute>
  )
}

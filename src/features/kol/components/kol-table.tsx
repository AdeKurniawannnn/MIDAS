"use client"

import { useEffect, useState } from "react"
import { nocodb } from "@/lib/database/nocodb"
import { LoaderIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

interface KolRecord {
  id: number
  name: string
  platform: string
  followers: number
  category: string
}

export default function KolTable() {
  const [data, setData] = useState<KolRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRows, setTotalRows] = useState(0)
  const [pageInput, setPageInput] = useState('')
  const itemsPerPage = 100

  // Calculate total pages
  const totalPages = Math.ceil(totalRows / itemsPerPage);

  // Handle page navigation
  const handlePageNavigation = (pageNumber: string) => {
    const page = parseInt(pageNumber)
    
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Handle page input change
  const handlePageInputChange = (value: string) => {
    setPageInput(value)
  }

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (pageInput && !isNaN(parseInt(pageInput))) {
        handlePageNavigation(pageInput)
      } else if (pageInput === '') {
        // If input is empty, go to page 1
        setCurrentPage(1)
      }
      setPageInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (currentPage < totalPages) {
        setCurrentPage(prev => prev + 1)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (currentPage > 1) {
        setCurrentPage(prev => prev - 1)
      }
    }
  }

  useEffect(() => {
    async function fetchKol() {
      try {
        setLoading(true)
        // Ambil slug project & table dari ENV agar mudah dikonfigurasi
        const projectSlug = process.env.NEXT_PUBLIC_NOCODB_PROJECT as string
        const tableSlug = process.env.NEXT_PUBLIC_NOCODB_TABLE as string
        const viewSlug = process.env.NEXT_PUBLIC_NOCODB_VIEW as string | undefined
        const fieldSetSlug = process.env.NEXT_PUBLIC_NOCODB_FIELDSET as string | undefined

        if (!projectSlug || !tableSlug) {
          throw new Error("Env NEXT_PUBLIC_NOCODB_PROJECT atau NEXT_PUBLIC_NOCODB_TABLE belum diset")
        }

        let res
        const offset = (currentPage - 1) * itemsPerPage
        if (viewSlug) {
          // gunakan view spesifik dengan pagination
          res = await nocodb.dbViewRow.list(projectSlug!, tableSlug!, viewSlug!, fieldSetSlug ?? "", {
            limit: itemsPerPage,
            offset: offset
          })
        } else {
          // fallback ambil row tabel dengan pagination
          res = await nocodb.dbTableRow.list(projectSlug!, tableSlug!, {
            limit: itemsPerPage,
            offset: offset
          })
        }
        // @ts-ignore
        setData(res.list as KolRecord[])
        // @ts-ignore
        setTotalRows(res.pageInfo?.totalRows ?? 0)
      } catch (e: any) {
        console.error(e)
        setError("Gagal mengambil data KOL")
      } finally {
        setLoading(false)
      }
    }
    fetchKol()
  }, [currentPage])

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <LoaderIcon className="animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Buat tabel dinamis berdasarkan kunci object, kecuali kolom id
  const columns = data.length > 0 ? Object.keys(data[0]).filter(col => col !== 'id') : []

  return (
    <div className="overflow-auto">
      <table className="min-w-full divide-y divide-muted text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium uppercase tr``acking-wider whitespace-nowrap">
              No
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-3 py-2 text-left font-medium uppercase tracking-wider whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-muted">
          {data.map((row, idx) => (
            <tr key={row.id ?? idx} className="hover:bg-muted/30">
              <td className="px-3 py-2 whitespace-nowrap">{((currentPage - 1) * itemsPerPage) + idx + 1}</td>
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 whitespace-nowrap">
                  {(() => {
                    const val: any = (row as any)[col]
                    if (val === null || val === undefined || val === '') return '-'
                    if (typeof val === 'number') return val.toLocaleString()
                    return String(val)
                  })()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 px-3">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-muted/50 rounded disabled:opacity-50"
          >
            Sebelumnya
          </button>
          
          <div className="flex items-center space-x-2 text-sm">
            <span>Halaman</span>
            <Input
              type="number"
              value={pageInput !== '' ? pageInput : currentPage}
              onChange={(e) => handlePageInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => setPageInput('')}
              onFocus={() => setPageInput('')}
              className="w-16 h-8 text-center"
              min="1"
              max={totalPages}
            />
            <span>dari {totalPages}</span>
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-muted/50 rounded disabled:opacity-50"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  )
}

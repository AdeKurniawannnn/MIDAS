"use client"

import { useState, useMemo, useEffect } from "react"
import { useAuth } from '@/lib/providers/AuthProvider'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { TableSkeleton } from "@/components/ui/skeleton-loader"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ColumnsIcon,
  SaveIcon,
  EditIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  CopyIcon,
  TrashIcon,
  ExternalLinkIcon,
  Download,
  RotateCcw,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from '@/lib/database/supabase'

// Interface untuk data Instagram scraping
interface DataScrapingInstagram {
  id: number
  inputUrl: string
  username: string | null
  followersCount: string | null
  followsCount: string | null
  biography: string | null
  postsCount: string | null
  highlightReelCount: string | null
  igtvVideoCount: string | null
  latestPostsTotal: string | null
  latestPostsLikes: string | null
  latestPostsComments: string | null
  Url: string | null
  User_Id: string | null
  gmail: string | null
}

interface InstagramTableProps {
  data: DataScrapingInstagram[]
  isLoading?: boolean
  onRefresh?: () => void
}

// Komponen untuk cell yang bisa diedit
function EditableCell({ 
  value: initialValue, 
  row, 
  column, 
  table 
}: {
  value: any
  row: any
  column: any
  table: any
}) {
  const [value, setValue] = useState(initialValue || "")
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('data_screping_instagram')
        .update({ [column.id]: value })
        .eq('id', row.original.id)

      if (error) {
        throw new Error(error.message)
      }

      // Update data di tabel
      table.options.meta?.updateData(row.index, column.id, value)
      setIsEditing(false)
      toast.success('Data berhasil diupdate')
    } catch (error) {
      toast.error('Gagal update data: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setValue(initialValue || "")
    setIsEditing(false)
  }

  if (column.id === 'id') {
    return <span>{value}</span>
  }

  // Khusus untuk URL, tampilkan dalam format yang lebih pendek
  if (column.id === 'inputUrl') {
    const displayUrl = value ? new URL(value).pathname.replace(/\/$/, '') : '-'
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 text-xs"
            disabled={isLoading}
          />
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 w-6 p-0"
            onClick={handleSave}
            disabled={isLoading}
          >
            <SaveIcon className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 w-6 p-0"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <XIcon className="h-3 w-3" />
          </Button>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1 group">
        <span className="truncate max-w-[150px]" title={value}>{displayUrl}</span>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
          onClick={() => setIsEditing(true)}
        >
          <EditIcon className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 text-xs"
          disabled={isLoading}
        />
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-6 w-6 p-0"
          onClick={handleSave}
          disabled={isLoading}
        >
          <SaveIcon className="h-3 w-3" />
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-6 w-6 p-0"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <XIcon className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 group">
      <span className="truncate">{value || '-'}</span>
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
        onClick={() => setIsEditing(true)}
      >
        <EditIcon className="h-3 w-3" />
      </Button>
    </div>
  )
}

// Komponen untuk Menu Aksi
function ActionMenu({ row }: { row: any }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(row.original.inputUrl)
    toast.success('URL berhasil disalin')
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('data_screping_instagram')
        .delete()
        .eq('id', row.original.id)

      if (error) throw error
      toast.success('Data berhasil dihapus')
      // Refresh halaman untuk memperbarui data
      window.location.reload()
    } catch (error) {
      toast.error('Gagal menghapus data')
    }
  }

  const handleOpenInstagram = () => {
    window.open(row.original.inputUrl, '_blank')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopy}>
          <CopyIcon className="mr-2 h-4 w-4" />
          <span>Salin URL</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenInstagram}>
          <ExternalLinkIcon className="mr-2 h-4 w-4" />
          <span>Buka di Instagram</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          <TrashIcon className="mr-2 h-4 w-4" />
          <span>Hapus</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function InstagramTable({ 
  data: initialData, 
  isLoading = false, 
  onRefresh 
}: InstagramTableProps) {
  const { user } = useAuth()
  const [data, setData] = useState(initialData)
  const [filteredData, setFilteredData] = useState(initialData)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    id: false, // Sembunyikan kolom ID asli
    username: true,
    inputUrl: true,
    followersCount: true,
    followsCount: true,
    postsCount: true,
    biography: false,
    highlightReelCount: false,
    igtvVideoCount: false,
    latestPostsTotal: true,
    latestPostsLikes: true,
    latestPostsComments: true,
    gmail: false,
  })
  const [rowSelection, setRowSelection] = useState({})
  const [pageInput, setPageInput] = useState('')
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false)

  // Handle page navigation
  const handlePageNavigation = (pageNumber: string) => {
    const page = parseInt(pageNumber)
    const totalPages = table.getPageCount()
    
    if (page >= 1 && page <= totalPages) {
      table.setPageIndex(page - 1) // TanStack Table uses 0-based indexing
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
        table.setPageIndex(0) // TanStack Table uses 0-based indexing
      }
      setPageInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (table.getCanNextPage()) {
        table.nextPage()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (table.getCanPreviousPage()) {
        table.previousPage()
      }
    }
  }

  // Bulk operation handlers
  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error('Pilih setidaknya satu baris untuk dihapus')
      return
    }

    setBulkOperationLoading(true)
    try {
      const ids = selectedRows.map(row => row.original.id)
      const { error } = await supabase
        .from('data_screping_instagram')
        .delete()
        .in('id', ids)

      if (error) throw error
      
      toast.success(`${selectedRows.length} data berhasil dihapus`)
      setRowSelection({})
      if (onRefresh) onRefresh()
    } catch (error) {
      toast.error('Gagal menghapus data')
    } finally {
      setBulkOperationLoading(false)
    }
  }

  const handleBulkExport = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error('Pilih setidaknya satu baris untuk diekspor')
      return
    }

    const csvContent = [
      // Header
      ['Username', 'URL', 'Followers', 'Following', 'Posts', 'Biography'].join(','),
      // Data
      ...selectedRows.map(row => [
        row.original.username || '',
        row.original.inputUrl || '',
        row.original.followersCount || '',
        row.original.followsCount || '',
        row.original.postsCount || '',
        (row.original.biography || '').replace(/,/g, ';')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `instagram-data-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success(`${selectedRows.length} data berhasil diekspor`)
  }

  // Filter data berdasarkan email user yang login
  useEffect(() => {
    if (user && user.email) {
      const filtered = initialData.filter(item => item.gmail === user.email || item.User_Id === user.email)
      setFilteredData(filtered)
    } else {
      setFilteredData([])
    }
  }, [initialData, user])

  // Kolom yang bisa disembunyikan
  const columns: ColumnDef<DataScrapingInstagram>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "actions",
        cell: ({ row }) => <ActionMenu row={row} />,
      },
      {
        id: "no",
        header: "No",
        cell: ({ row }) => {
          // Menggunakan index dari seluruh data yang sudah difilter dan disort
          const allFilteredRows = table.getFilteredRowModel().rows
          const rowNumber = allFilteredRows.findIndex(r => r.id === row.id) + 1
          return <div className="text-center">{rowNumber}</div>
        },
        enableSorting: false,
      },
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("id")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("username")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "inputUrl",
        header: "Input URL",
        cell: ({ row, column, table }) => (
          <div className="max-w-[200px]">
            <EditableCell 
              value={row.getValue("inputUrl")} 
              row={row} 
              column={column} 
              table={table}
            />
          </div>
        ),
      },
      {
        accessorKey: "followersCount",
        header: "Followers",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("followersCount")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "followsCount",
        header: "Following",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("followsCount")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "postsCount",
        header: "Posts",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("postsCount")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "highlightReelCount",
        header: "Highlights",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("highlightReelCount")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "igtvVideoCount",
        header: "IGTV",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("igtvVideoCount")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "latestPostsTotal",
        header: "Latest Posts",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("latestPostsTotal")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "latestPostsLikes",
        header: "Avg. Likes",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("latestPostsLikes")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "latestPostsComments",
        header: "Avg. Comments",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("latestPostsComments")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "biography",
        header: "Biography",
        cell: ({ row, column, table }) => (
          <div className="max-w-[200px]">
            <EditableCell 
              value={row.getValue("biography")} 
              row={row} 
              column={column} 
              table={table}
            />
          </div>
        ),
      },
      {
        accessorKey: "gmail",
        header: "User Email",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("gmail") || row.original.User_Id} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data: filteredData, // Gunakan filteredData instead of data
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      updateData: (rowIndex: number, columnId: string, value: any) => {
        setFilteredData(prev => prev.map((row, index) => 
          index === rowIndex ? { ...row, [columnId]: value } : row
        ))
      },
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-muted-foreground">Loading data...</span>
            </div>
          </div>
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
        <TableSkeleton rows={10} columns={6} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Filter username..."
            value={(table.getColumn("username")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("username")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ColumnsIcon className="mr-2 h-4 w-4" />
                Tampilan Kolom
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === "inputUrl" ? "URL" : 
                       column.id === "followersCount" ? "Followers" :
                       column.id === "followsCount" ? "Following" :
                       column.id === "postsCount" ? "Posts" :
                       column.id === "highlightReelCount" ? "Highlights" :
                       column.id === "igtvVideoCount" ? "IGTV" :
                       column.id === "latestPostsTotal" ? "Latest Posts" :
                       column.id === "latestPostsLikes" ? "Avg. Likes" :
                       column.id === "latestPostsComments" ? "Avg. Comments" :
                       column.id === "gmail" ? "Email" :
                       column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">
              {Object.keys(rowSelection).length} item(s) selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkExport}
              disabled={bulkOperationLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkOperationLoading}
              className="text-red-600 hover:text-red-700"
            >
              {bulkOperationLoading ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <TrashIcon className="mr-2 h-4 w-4" />
              )}
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Belum ada data. Silakan tambahkan URL Instagram untuk mulai scraping.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Menampilkan {table.getFilteredRowModel().rows.length} dari {filteredData.length} data
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-2 text-sm">
            <span>Halaman</span>
            <Input
              type="number"
              value={pageInput !== '' ? pageInput : (table.getState().pagination.pageIndex + 1)}
              onChange={(e) => handlePageInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => setPageInput('')}
              onFocus={() => setPageInput('')}
              className="w-16 h-8 text-center"
              min="1"
              max={table.getPageCount()}
            />
            <span>dari {table.getPageCount()}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 
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
import { FuzzySearchBar } from './fuzzy-search-bar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AnimatedButton, useAnimatedButton } from "@/components/ui/animated-button"
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

// Interface for Instagram scraping data
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

// Component for editable cell
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
  const saveButton = useAnimatedButton()
  const editButton = useAnimatedButton()

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

      // Update data in table
      table.options.meta?.updateData(row.index, column.id, value)
      setIsEditing(false)
      toast.success('Data updated successfully')
    } catch (error) {
      toast.error('Failed to update data: ' + (error instanceof Error ? error.message : 'Unknown error'))
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

  // For URLs, display in shorter format
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
          <AnimatedButton 
            size="sm" 
            variant="ghost" 
            className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
            onClick={handleSave}
            disabled={isLoading}
            loading={isLoading}
            animationType="scale"
          >
            <SaveIcon className="h-3 w-3" />
          </AnimatedButton>
          <AnimatedButton 
            size="sm" 
            variant="ghost" 
            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
            onClick={handleCancel}
            disabled={isLoading}
            animationType="scale"
          >
            <XIcon className="h-3 w-3" />
          </AnimatedButton>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1 group">
        <span className="truncate max-w-[150px]" title={value}>{displayUrl}</span>
        <AnimatedButton 
          size="sm" 
          variant="ghost" 
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-600"
          onClick={() => setIsEditing(true)}
          animationType="scale"
        >
          <EditIcon className="h-3 w-3" />
        </AnimatedButton>
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
        <AnimatedButton 
          size="sm" 
          variant="ghost" 
          className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
          onClick={handleSave}
          disabled={isLoading}
          loading={isLoading}
          animationType="scale"
        >
          <SaveIcon className="h-3 w-3" />
        </AnimatedButton>
        <AnimatedButton 
          size="sm" 
          variant="ghost" 
          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
          onClick={handleCancel}
          disabled={isLoading}
          animationType="scale"
        >
          <XIcon className="h-3 w-3" />
        </AnimatedButton>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 group">
      <span className="truncate">{value || '-'}</span>
      <AnimatedButton 
        size="sm" 
        variant="ghost" 
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-600"
        onClick={() => setIsEditing(true)}
        animationType="scale"
      >
        <EditIcon className="h-3 w-3" />
      </AnimatedButton>
    </div>
  )
}

// Component for Action Menu
function ActionMenu({ row }: { row: any }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(row.original.inputUrl)
    toast.success('URL copied successfully')
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('data_screping_instagram')
        .delete()
        .eq('id', row.original.id)

      if (error) throw error
      toast.success('Data deleted successfully')
      // Refresh page to update data
      window.location.reload()
    } catch (error) {
      toast.error('Failed to delete data')
    }
  }

  const handleOpenInstagram = () => {
    window.open(row.original.inputUrl, '_blank')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AnimatedButton 
          variant="ghost" 
          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
          animationType="scale"
        >
          <MoreHorizontalIcon className="h-4 w-4" />
        </AnimatedButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopy}>
          <CopyIcon className="mr-2 h-4 w-4" />
          <span>Copy URL</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOpenInstagram}>
          <ExternalLinkIcon className="mr-2 h-4 w-4" />
          <span>Open in Instagram</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          <TrashIcon className="mr-2 h-4 w-4" />
          <span>Delete</span>
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
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    id: false, // Hide original ID column
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
      toast.error('Select at least one row to delete')
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
      
      toast.success(`${selectedRows.length} data deleted successfully`)
      setRowSelection({})
      if (onRefresh) onRefresh()
    } catch (error) {
      toast.error('Failed to delete data')
    } finally {
      setBulkOperationLoading(false)
    }
  }

  const handleBulkExport = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error('Select at least one row to export')
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
    
    toast.success(`${selectedRows.length} data exported successfully`)
  }

  // Filter data based on logged-in user's email
  useEffect(() => {
    if (user && user.email) {
      const filtered = initialData.filter(item => item.gmail === user.email || item.User_Id === user.email)
      setFilteredData(filtered)
    } else {
      setFilteredData([])
    }
  }, [initialData, user])

  // Fuzzy search function
  const fuzzyFilter = (row: any, columnId: string, value: string, addMeta: any) => {
    if (!value || !value.trim()) return true
    
    const searchValue = value.toLowerCase()
    const rowValues = [
      row.original.username,
      row.original.inputUrl,
      row.original.followersCount,
      row.original.followsCount,
      row.original.biography,
      row.original.postsCount,
      row.original.highlightReelCount,
      row.original.igtvVideoCount,
      row.original.latestPostsTotal,
      row.original.latestPostsLikes,
      row.original.latestPostsComments,
    ]
    
    return rowValues.some(val => 
      val && val.toString().toLowerCase().includes(searchValue)
    )
  }

  // Searchable fields configuration
  const searchableFields = useMemo(() => [
    { key: 'username', label: 'Username', type: 'text' as const, searchable: true },
    { key: 'inputUrl', label: 'URL', type: 'text' as const, searchable: true },
    { key: 'followersCount', label: 'Followers', type: 'number' as const, searchable: true },
    { key: 'followsCount', label: 'Following', type: 'number' as const, searchable: true },
    { key: 'biography', label: 'Biography', type: 'text' as const, searchable: true },
    { key: 'postsCount', label: 'Posts', type: 'number' as const, searchable: true },
    { key: 'highlightReelCount', label: 'Highlights', type: 'number' as const, searchable: true },
    { key: 'igtvVideoCount', label: 'IGTV Videos', type: 'number' as const, searchable: true },
    { key: 'latestPostsTotal', label: 'Latest Posts', type: 'number' as const, searchable: true },
    { key: 'latestPostsLikes', label: 'Avg Likes', type: 'number' as const, searchable: true },
    { key: 'latestPostsComments', label: 'Avg Comments', type: 'number' as const, searchable: true },
  ], [])

  // Handle search
  const handleSearch = (query: string, filters: any[]) => {
    setGlobalFilter(query)
  }

  // Columns that can be hidden
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
          // Using index from all filtered and sorted data
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
    data: filteredData, // Use filteredData instead of data
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: fuzzyFilter,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
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
            <AnimatedButton 
              variant="outline" 
              onClick={onRefresh} 
              disabled={isLoading}
              animationType="hover"
              className="hover:bg-blue-100 hover:text-blue-600"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Refresh
            </AnimatedButton>
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
          <div className="max-w-md">
            <FuzzySearchBar
              onSearch={handleSearch}
              searchableFields={searchableFields}
              placeholder="Search across all Instagram data..."
              className="w-full"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <AnimatedButton 
                variant="outline"
                animationType="hover"
                className="hover:bg-blue-100 hover:text-blue-600"
              >
                <ColumnsIcon className="mr-2 h-4 w-4" />
                Column View
              </AnimatedButton>
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
            <AnimatedButton 
              variant="outline" 
              onClick={onRefresh} 
              disabled={isLoading}
              animationType="hover"
              className="hover:bg-blue-100 hover:text-blue-600"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Refresh
            </AnimatedButton>
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
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={handleBulkExport}
              disabled={bulkOperationLoading}
              animationType="hover"
              className="hover:bg-green-100 hover:text-green-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </AnimatedButton>
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkOperationLoading}
              loading={bulkOperationLoading}
              animationType="hover"
              className="text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete Selected
            </AnimatedButton>
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
                  No data yet. Please add Instagram URLs to start scraping.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of {filteredData.length} data
        </div>
        <div className="flex items-center space-x-2">
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            animationType="hover"
            className="hover:bg-blue-100 hover:text-blue-600"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </AnimatedButton>
          
          <div className="flex items-center space-x-2 text-sm">
            <span>Page</span>
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
            <span>of {table.getPageCount()}</span>
          </div>

          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            animationType="hover"
            className="hover:bg-blue-100 hover:text-blue-600"
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </AnimatedButton>
        </div>
      </div>
    </div>
  )
} 
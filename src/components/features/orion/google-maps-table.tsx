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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { TableSkeleton } from "@/components/ui/skeleton-loader"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
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
  CheckCircle2,
  MapPin,
  Navigation,
  Globe,
  Star,
  Phone,
  Clock,
  Users,
  Camera,
  MessageCircle
} from "lucide-react"
import { toast } from "sonner"
import { InteractiveMap } from './interactive-map'
import { supabase } from '@/lib/database/supabase'

interface GoogleMapsData {
  id: number
  inputUrl: string
  placeName: string | null
  address: string | null
  phoneNumber: string | null
  website: string | null
  rating: string | null
  reviewCount: string | null
  category: string | null
  hours: string | null
  description: string | null
  coordinates: string | null
  imageUrl: string | null
  priceRange: string | null
  User_Id: string | null
  gmail: string | null
  createdAt: string
}

interface GoogleMapsTableProps {
  data: GoogleMapsData[]
  isLoading?: boolean
  onRefresh?: () => void
}

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
        .from('google_maps_data')
        .update({ [column.id]: value })
        .eq('id', row.original.id)

      if (error) {
        throw new Error(error.message)
      }

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

  if (column.id === 'inputUrl' || column.id === 'website') {
    const displayUrl = value ? new URL(value).hostname : '-'
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

  if (column.id === 'rating') {
    const ratingValue = parseFloat(value) || 0
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
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-500 fill-current" />
          <span>{ratingValue > 0 ? ratingValue.toFixed(1) : '-'}</span>
        </div>
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

function ActionMenu({ row }: { row: any }) {
  const handleCopyAddress = () => {
    const address = row.original.address || row.original.placeName
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success('Address copied successfully')
    }
  }

  const handleCopyPhone = () => {
    if (row.original.phoneNumber) {
      navigator.clipboard.writeText(row.original.phoneNumber)
      toast.success('Phone number copied successfully')
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('google_maps_data')
        .delete()
        .eq('id', row.original.id)

      if (error) throw error
      toast.success('Data deleted successfully')
      window.location.reload()
    } catch (error) {
      toast.error('Failed to delete data')
    }
  }

  const handleOpenMaps = () => {
    if (row.original.coordinates) {
      const coords = row.original.coordinates.split(',')
      window.open(`https://maps.google.com/?q=${coords[0]},${coords[1]}`, '_blank')
    } else if (row.original.address) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(row.original.address)}`, '_blank')
    }
  }

  const handleOpenWebsite = () => {
    if (row.original.website) {
      window.open(row.original.website, '_blank')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyAddress}>
          <CopyIcon className="mr-2 h-4 w-4" />
          <span>Copy Address</span>
        </DropdownMenuItem>
        {row.original.phoneNumber && (
          <DropdownMenuItem onClick={handleCopyPhone}>
            <Phone className="mr-2 h-4 w-4" />
            <span>Copy Phone Number</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleOpenMaps}>
          <MapPin className="mr-2 h-4 w-4" />
          <span>Open in Maps</span>
        </DropdownMenuItem>
        {row.original.website && (
          <DropdownMenuItem onClick={handleOpenWebsite}>
            <Globe className="mr-2 h-4 w-4" />
            <span>Open Website</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          <TrashIcon className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function GoogleMapsTable({ 
  data: initialData, 
  isLoading = false, 
  onRefresh 
}: GoogleMapsTableProps) {
  const { user } = useAuth()
  const [data, setData] = useState(initialData)
  const [filteredData, setFilteredData] = useState(initialData)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    id: false,
    placeName: true,
    address: true,
    phoneNumber: true,
    website: true,
    rating: true,
    reviewCount: true,
    category: true,
    hours: false,
    description: false,
    coordinates: false,
    imageUrl: false,
    priceRange: false,
    gmail: false,
  })
  const [rowSelection, setRowSelection] = useState({})
  const [pageInput, setPageInput] = useState('')
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false)

  const handlePageNavigation = (pageNumber: string) => {
    const page = parseInt(pageNumber)
    const totalPages = table.getPageCount()
    
    if (page >= 1 && page <= totalPages) {
      table.setPageIndex(page - 1)
    }
  }

  const handlePageInputChange = (value: string) => {
    setPageInput(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (pageInput && !isNaN(parseInt(pageInput))) {
        handlePageNavigation(pageInput)
      } else if (pageInput === '') {
        table.setPageIndex(0)
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
        .from('google_maps_data')
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
      ['Place Name', 'Address', 'Phone', 'Website', 'Rating', 'Reviews', 'Category'].join(','),
      ...selectedRows.map(row => [
        row.original.placeName || '',
        row.original.address || '',
        row.original.phoneNumber || '',
        row.original.website || '',
        row.original.rating || '',
        row.original.reviewCount || '',
        row.original.category || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `google-maps-data-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success(`${selectedRows.length} data exported successfully`)
  }

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
      row.original.placeName,
      row.original.address,
      row.original.phoneNumber,
      row.original.website,
      row.original.category,
      row.original.description,
      row.original.rating,
      row.original.reviewCount,
      row.original.hours,
      row.original.priceRange,
    ]
    
    return rowValues.some(val => 
      val && val.toString().toLowerCase().includes(searchValue)
    )
  }

  // Searchable fields configuration
  const searchableFields = useMemo(() => [
    { key: 'placeName', label: 'Place Name', type: 'text' as const, searchable: true },
    { key: 'address', label: 'Address', type: 'text' as const, searchable: true },
    { key: 'phoneNumber', label: 'Phone Number', type: 'text' as const, searchable: true },
    { key: 'website', label: 'Website', type: 'text' as const, searchable: true },
    { key: 'category', label: 'Category', type: 'text' as const, searchable: true },
    { key: 'description', label: 'Description', type: 'text' as const, searchable: true },
    { key: 'rating', label: 'Rating', type: 'number' as const, searchable: true },
    { key: 'reviewCount', label: 'Review Count', type: 'number' as const, searchable: true },
    { key: 'hours', label: 'Hours', type: 'text' as const, searchable: true },
    { key: 'priceRange', label: 'Price Range', type: 'text' as const, searchable: true },
  ], [])

  // Handle search
  const handleSearch = (query: string, filters: any[]) => {
    setGlobalFilter(query)
  }

  const columns: ColumnDef<GoogleMapsData>[] = useMemo(
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
        accessorKey: "placeName",
        header: "Place Name",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("placeName")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "address",
        header: "Address",
        cell: ({ row, column, table }) => (
          <div className="max-w-[200px]">
            <EditableCell 
              value={row.getValue("address")} 
              row={row} 
              column={column} 
              table={table}
            />
          </div>
        ),
      },
      {
        accessorKey: "phoneNumber",
        header: "Phone",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("phoneNumber")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "website",
        header: "Website",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("website")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "rating",
        header: "Rating",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("rating")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "reviewCount",
        header: "Reviews",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("reviewCount")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("category")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "hours",
        header: "Hours",
        cell: ({ row, column, table }) => (
          <div className="max-w-[150px]">
            <EditableCell 
              value={row.getValue("hours")} 
              row={row} 
              column={column} 
              table={table}
            />
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row, column, table }) => (
          <div className="max-w-[200px]">
            <EditableCell 
              value={row.getValue("description")} 
              row={row} 
              column={column} 
              table={table}
            />
          </div>
        ),
      },
      {
        accessorKey: "coordinates",
        header: "Coordinates",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("coordinates")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "imageUrl",
        header: "Image URL",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("imageUrl")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "priceRange",
        header: "Price Range",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("priceRange")} 
            row={row} 
            column={column} 
            table={table}
          />
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
    data: filteredData,
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
            <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
        <TableSkeleton rows={10} columns={8} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="max-w-md">
            <FuzzySearchBar
              onSearch={handleSearch}
              searchableFields={searchableFields}
              placeholder="Search across all Google Maps data..."
              className="w-full"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ColumnsIcon className="mr-2 h-4 w-4" />
                Column View
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
                      {column.id === "placeName" ? "Place Name" : 
                       column.id === "phoneNumber" ? "Phone" :
                       column.id === "reviewCount" ? "Reviews" :
                       column.id === "priceRange" ? "Price Range" :
                       column.id === "imageUrl" ? "Image URL" :
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
                  No data yet. Please add Google Maps URLs to start scraping.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of {filteredData.length} data
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
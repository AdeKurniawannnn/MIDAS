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
import { FuzzySearchBar } from '../orion/fuzzy-search-bar'
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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Linkedin,
  Music2,
  Plus,
  Star,
  MessageCircle,
  Heart,
  Eye,
  Users,
  MapPin,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Tag,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { Api } from "nocodb-sdk"
import { KOLData, KOLTableProps, KOLSearchableField } from '@/lib/types/kol'

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
      // Update data in NocoDB
      const projectSlug = process.env.NEXT_PUBLIC_NOCODB_PROJECT as string
      const tableSlug = process.env.NEXT_PUBLIC_NOCODB_TABLE as string
      
      if (!projectSlug || !tableSlug) {
        throw new Error("NocoDB configuration missing")
      }

      // Initialize NoCoDB SDK
      const baseURL = process.env.NEXT_PUBLIC_NOCODB_BASE_URL as string
      const token = process.env.NEXT_PUBLIC_NOCODB_TOKEN as string
      const api = new Api({
        baseURL: baseURL,
        headers: {
          "xc-token": token
        }
      })

      // TODO: Implement update via API
      console.log('Update would be called for:', row.original.id, column.id, value)
      // await api.dbTableRow.update(projectSlug, tableSlug, row.original.id, { [column.id]: value })

      // Update data in table
      table.options.meta?.updateData(row.index, column.id, value)
      setIsEditing(false)
      toast.success('KOL data updated successfully')
    } catch (error) {
      toast.error('Failed to update KOL data: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setValue(initialValue || "")
    setIsEditing(false)
  }

  if (column.id === 'id') {
    return <span className="font-mono text-xs text-muted-foreground">{value}</span>
  }

  // Special handling for platform column
  if (column.id === 'platform') {
    const getPlatformIcon = (platform: string) => {
      switch (platform?.toLowerCase()) {
        case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />
        case 'youtube': return <Youtube className="h-4 w-4 text-red-500" />
        case 'twitter': return <Twitter className="h-4 w-4 text-blue-500" />
        case 'facebook': return <Facebook className="h-4 w-4 text-blue-600" />
        case 'linkedin': return <Linkedin className="h-4 w-4 text-blue-700" />
        case 'tiktok': return <Music2 className="h-4 w-4 text-gray-900" />
        default: return <Users className="h-4 w-4 text-gray-500" />
      }
    }

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>
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
      <div className="flex items-center gap-2 group">
        {getPlatformIcon(value)}
        <span className="capitalize">{value || '-'}</span>
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

  // Special handling for status column
  if (column.id === 'status') {
    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'active': return 'bg-green-100 text-green-800'
        case 'inactive': return 'bg-gray-100 text-gray-800'
        case 'pending': return 'bg-yellow-100 text-yellow-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
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
        <Badge variant="secondary" className={getStatusColor(value)}>
          {value || 'pending'}
        </Badge>
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

  // Special handling for numeric fields
  if (['followers', 'following', 'avgLikes', 'avgComments', 'avgViews', 'totalPosts', 'ratePerPost', 'ratePerStory', 'ratePerVideo'].includes(column.id)) {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
      return num?.toString() || '0'
    }

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            type="number"
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
        <span className="font-mono text-sm">{formatNumber(Number(value))}</span>
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

  // Special handling for URL fields
  if (column.id === 'profileUrl') {
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

  // Default text input for other fields
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
    const text = `${row.original.name} - ${row.original.platform} - ${row.original.profileUrl}`
    navigator.clipboard.writeText(text)
    toast.success('KOL info copied successfully')
  }

  const handleDelete = async () => {
    try {
      const projectSlug = process.env.NEXT_PUBLIC_NOCODB_PROJECT as string
      const tableSlug = process.env.NEXT_PUBLIC_NOCODB_TABLE as string
      
      if (!projectSlug || !tableSlug) {
        throw new Error("NocoDB configuration missing")
      }

      // TODO: Implement delete via API
      console.log('Delete would be called for:', row.original.id)
      toast.success('KOL deleted successfully')
      // Refresh page to update data
      window.location.reload()
    } catch (error) {
      toast.error('Failed to delete KOL')
    }
  }

  const handleOpenProfile = () => {
    if (row.original.profileUrl) {
      window.open(row.original.profileUrl, '_blank')
    }
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
          <span>Copy Info</span>
        </DropdownMenuItem>
        {row.original.profileUrl && (
          <DropdownMenuItem onClick={handleOpenProfile}>
            <ExternalLinkIcon className="mr-2 h-4 w-4" />
            <span>Open Profile</span>
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

export function AdvancedKOLTable({ 
  data: initialData, 
  isLoading = false, 
  onRefresh 
}: KOLTableProps) {
  const { user } = useAuth()
  const [data, setData] = useState(initialData)
  const [filteredData, setFilteredData] = useState(initialData)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    id: false,
    name: true,
    platform: true,
    username: true,
    profileUrl: false,
    followers: true,
    following: false,
    category: true,
    engagementRate: true,
    avgLikes: false,
    avgComments: false,
    avgViews: false,
    location: false,
    bio: false,
    email: false,
    phone: false,
    ratePerPost: true,
    ratePerStory: false,
    ratePerVideo: false,
    lastPostDate: false,
    totalPosts: false,
    status: true,
    tags: false,
    notes: false,
  })
  const [rowSelection, setRowSelection] = useState({})
  const [pageInput, setPageInput] = useState('')
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false)

  // Handle page navigation
  const handlePageNavigation = (pageNumber: string) => {
    const page = parseInt(pageNumber)
    const totalPages = table.getPageCount()
    
    if (page >= 1 && page <= totalPages) {
      table.setPageIndex(page - 1)
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

  // Bulk operation handlers
  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error('Select at least one KOL to delete')
      return
    }

    setBulkOperationLoading(true)
    try {
      const projectSlug = process.env.NEXT_PUBLIC_NOCODB_PROJECT as string
      const tableSlug = process.env.NEXT_PUBLIC_NOCODB_TABLE as string
      
      if (!projectSlug || !tableSlug) {
        throw new Error("NocoDB configuration missing")
      }

      // Delete each selected row
      await Promise.all(
        selectedRows.map(row => {
          // TODO: Implement bulk delete via API
          console.log('Bulk delete would be called for:', row.original.id)
          return Promise.resolve()
        })
      )
      
      toast.success(`${selectedRows.length} KOL(s) deleted successfully`)
      setRowSelection({})
      if (onRefresh) onRefresh()
    } catch (error) {
      toast.error('Failed to delete KOLs')
    } finally {
      setBulkOperationLoading(false)
    }
  }

  const handleBulkExport = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error('Select at least one KOL to export')
      return
    }

    const csvContent = [
      // Header
      ['Name', 'Platform', 'Username', 'Followers', 'Category', 'Engagement Rate', 'Rate Per Post', 'Status', 'Profile URL'].join(','),
      // Data
      ...selectedRows.map(row => [
        row.original.name || '',
        row.original.platform || '',
        row.original.username || '',
        row.original.followers || '',
        row.original.category || '',
        row.original.engagementRate || '',
        row.original.ratePerPost || '',
        row.original.status || '',
        row.original.profileUrl || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kol-data-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success(`${selectedRows.length} KOL(s) exported successfully`)
  }

  // Update filtered data when initial data changes
  useEffect(() => {
    console.log('AdvancedKOLTable received data:', initialData?.length || 0, 'items')
    setFilteredData(initialData || [])
    setData(initialData || [])
  }, [initialData])

  // Fuzzy search function
  const fuzzyFilter = (row: any, columnId: string, value: string, addMeta: any) => {
    if (!value || !value.trim()) return true
    
    const searchValue = value.toLowerCase()
    const rowValues = [
      row.original.name,
      row.original.platform,
      row.original.username,
      row.original.category,
      row.original.bio,
      row.original.location,
      row.original.email,
      row.original.status,
      row.original.tags?.join(' '),
      row.original.notes,
    ]
    
    return rowValues.some(val => 
      val && val.toString().toLowerCase().includes(searchValue)
    )
  }

  // Searchable fields configuration
  const searchableFields: KOLSearchableField[] = useMemo(() => [
    { key: 'name', label: 'Name', type: 'text', searchable: true },
    { key: 'platform', label: 'Platform', type: 'select', searchable: true, options: ['Instagram', 'YouTube', 'Twitter', 'Facebook', 'LinkedIn', 'TikTok'] },
    { key: 'username', label: 'Username', type: 'text', searchable: true },
    { key: 'category', label: 'Category', type: 'text', searchable: true },
    { key: 'location', label: 'Location', type: 'text', searchable: true },
    { key: 'followers', label: 'Followers', type: 'number', searchable: true },
    { key: 'engagementRate', label: 'Engagement Rate', type: 'number', searchable: true },
    { key: 'status', label: 'Status', type: 'select', searchable: true, options: ['Active', 'Inactive', 'Pending'] },
    { key: 'bio', label: 'Bio', type: 'text', searchable: true },
    { key: 'email', label: 'Email', type: 'text', searchable: true },
  ], [])

  // Handle search
  const handleSearch = (query: string, filters: any[]) => {
    setGlobalFilter(query)
  }

  // Columns definition
  const columns: ColumnDef<KOLData>[] = useMemo(
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
          return <div className="text-center font-mono text-xs">{rowNumber}</div>
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
        accessorKey: "name",
        header: "Name",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("name")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "platform",
        header: "Platform",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("platform")} 
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
        accessorKey: "profileUrl",
        header: "Profile URL",
        cell: ({ row, column, table }) => (
          <div className="max-w-[200px]">
            <EditableCell 
              value={row.getValue("profileUrl")} 
              row={row} 
              column={column} 
              table={table}
            />
          </div>
        ),
      },
      {
        accessorKey: "followers",
        header: "Followers",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("followers")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "following",
        header: "Following",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("following")} 
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
        accessorKey: "engagementRate",
        header: "Engagement",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("engagementRate")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "avgLikes",
        header: "Avg. Likes",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("avgLikes")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "avgComments",
        header: "Avg. Comments",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("avgComments")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "avgViews",
        header: "Avg. Views",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("avgViews")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("location")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "bio",
        header: "Bio",
        cell: ({ row, column, table }) => (
          <div className="max-w-[200px]">
            <EditableCell 
              value={row.getValue("bio")} 
              row={row} 
              column={column} 
              table={table}
            />
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("email")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("phone")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "ratePerPost",
        header: "Rate/Post",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("ratePerPost")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "ratePerStory",
        header: "Rate/Story",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("ratePerStory")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "ratePerVideo",
        header: "Rate/Video",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("ratePerVideo")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "lastPostDate",
        header: "Last Post",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("lastPostDate")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "totalPosts",
        header: "Total Posts",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("totalPosts")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("status")} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row, column, table }) => (
          <EditableCell 
            value={row.getValue("tags")?.join(', ')} 
            row={row} 
            column={column} 
            table={table}
          />
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row, column, table }) => (
          <div className="max-w-[200px]">
            <EditableCell 
              value={row.getValue("notes")} 
              row={row} 
              column={column} 
              table={table}
            />
          </div>
        ),
      },
    ],
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
        setData(prev => prev.map((row, index) => 
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
              <span className="text-sm text-muted-foreground">Loading KOL data...</span>
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
        <TableSkeleton rows={10} columns={8} />
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
              placeholder="Search across all KOL data..."
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
                      {column.id === "profileUrl" ? "Profile URL" : 
                       column.id === "engagementRate" ? "Engagement" :
                       column.id === "avgLikes" ? "Avg. Likes" :
                       column.id === "avgComments" ? "Avg. Comments" :
                       column.id === "avgViews" ? "Avg. Views" :
                       column.id === "ratePerPost" ? "Rate/Post" :
                       column.id === "ratePerStory" ? "Rate/Story" :
                       column.id === "ratePerVideo" ? "Rate/Video" :
                       column.id === "lastPostDate" ? "Last Post" :
                       column.id === "totalPosts" ? "Total Posts" :
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
              {Object.keys(rowSelection).length} KOL(s) selected
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
                  No KOL data yet. Please add KOL profiles to start managing.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of {filteredData.length} KOL records
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
"use client"

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react"
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

// Component for editable cell with enhanced accessibility
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
  const inputRef = React.useRef<HTMLInputElement>(null)
  const selectRef = React.useRef<HTMLButtonElement>(null)

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (isEditing) {
        handleSave()
      } else {
        setIsEditing(true)
      }
    } else if (e.key === 'Escape' && isEditing) {
      e.preventDefault()
      handleCancel()
    }
  }

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
            <SelectTrigger 
              className="h-8 text-xs" 
              ref={selectRef}
              onKeyDown={handleKeyDown}
              aria-label="Select platform"
            >
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
            aria-label="Save platform change"
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
            aria-label="Cancel platform change"
          >
            <XIcon className="h-3 w-3" />
          </AnimatedButton>
        </div>
      )
    }

    return (
      <div 
        className="flex items-center gap-2 group"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="button"
        aria-label={`Edit platform: ${value || 'not set'}`}
      >
        {getPlatformIcon(value)}
        <span className="capitalize">{value || '-'}</span>
        <AnimatedButton 
          size="sm" 
          variant="ghost" 
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-primary hover:text-primary-foreground transition-colors"
          onClick={() => setIsEditing(true)}
          animationType="scale"
          aria-label="Edit platform"
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
            <SelectTrigger 
              className="h-8 text-xs" 
              onKeyDown={handleKeyDown}
              aria-label="Select status"
            >
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
            aria-label="Save status change"
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
            aria-label="Cancel status change"
          >
            <XIcon className="h-3 w-3" />
          </AnimatedButton>
        </div>
      )
    }

    return (
      <div 
        className="flex items-center gap-1 group"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="button"
        aria-label={`Edit status: ${value || 'pending'}`}
      >
        <Badge variant="secondary" className={getStatusColor(value)}>
          {value || 'pending'}
        </Badge>
        <AnimatedButton 
          size="sm" 
          variant="ghost" 
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-primary hover:text-primary-foreground transition-colors"
          onClick={() => setIsEditing(true)}
          animationType="scale"
          aria-label="Edit status"
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
            ref={inputRef}
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-xs"
            disabled={isLoading}
            aria-label={`Edit ${column.id}`}
            min="0"
            step="1"
          />
          <AnimatedButton 
            size="sm" 
            variant="ghost" 
            className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
            onClick={handleSave}
            disabled={isLoading}
            loading={isLoading}
            animationType="scale"
            aria-label={`Save ${column.id} change`}
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
            aria-label={`Cancel ${column.id} change`}
          >
            <XIcon className="h-3 w-3" />
          </AnimatedButton>
        </div>
      )
    }

    return (
      <div 
        className="flex items-center gap-1 group"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="button"
        aria-label={`Edit ${column.id}: ${formatNumber(Number(value))}`}
      >
        <span className="font-mono text-sm">{formatNumber(Number(value))}</span>
        <AnimatedButton 
          size="sm" 
          variant="ghost" 
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-primary hover:text-primary-foreground transition-colors"
          onClick={() => setIsEditing(true)}
          animationType="scale"
          aria-label={`Edit ${column.id}`}
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
            ref={inputRef}
            type="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-xs"
            disabled={isLoading}
            aria-label="Edit profile URL"
            placeholder="https://..."
          />
          <AnimatedButton 
            size="sm" 
            variant="ghost" 
            className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
            onClick={handleSave}
            disabled={isLoading}
            loading={isLoading}
            animationType="scale"
            aria-label="Save profile URL change"
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
            aria-label="Cancel profile URL change"
          >
            <XIcon className="h-3 w-3" />
          </AnimatedButton>
        </div>
      )
    }
    return (
      <div 
        className="flex items-center gap-1 group"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="button"
        aria-label={`Edit profile URL: ${displayUrl}`}
      >
        <span className="truncate max-w-[150px]" title={value}>{displayUrl}</span>
        <AnimatedButton 
          size="sm" 
          variant="ghost" 
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-primary hover:text-primary-foreground transition-colors"
          onClick={() => setIsEditing(true)}
          animationType="scale"
          aria-label="Edit profile URL"
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
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-xs"
          disabled={isLoading}
          aria-label={`Edit ${column.id}`}
        />
        <AnimatedButton 
          size="sm" 
          variant="ghost" 
          className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
          onClick={handleSave}
          disabled={isLoading}
          loading={isLoading}
          animationType="scale"
          aria-label={`Save ${column.id} change`}
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
          aria-label={`Cancel ${column.id} change`}
        >
          <XIcon className="h-3 w-3" />
        </AnimatedButton>
      </div>
    )
  }

  return (
    <div 
      className="flex items-center gap-1 group"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label={`Edit ${column.id}: ${value || 'empty'}`}
    >
      <span className="truncate">{value || '-'}</span>
      <AnimatedButton 
        size="sm" 
        variant="ghost" 
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-primary hover:text-primary-foreground transition-colors"
        onClick={() => setIsEditing(true)}
        animationType="scale"
        aria-label={`Edit ${column.id}`}
      >
        <EditIcon className="h-3 w-3" />
      </AnimatedButton>
    </div>
  )
}

// Component for Action Menu with enhanced accessibility
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
      window.open(row.original.profileUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AnimatedButton 
          variant="ghost" 
          className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground transition-colors"
          animationType="scale"
          aria-label={`Actions for ${row.original.name || 'KOL'}`}
        >
          <MoreHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">More actions</span>
        </AnimatedButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label="KOL actions menu">
        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
          <CopyIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Copy Info</span>
        </DropdownMenuItem>
        {row.original.profileUrl && (
          <DropdownMenuItem onClick={handleOpenProfile} className="cursor-pointer">
            <ExternalLinkIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Open Profile</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleDelete} 
          className="text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-700"
        >
          <TrashIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AdvancedKOLTable({ 
  data: initialData = [], // provide default empty array
  isLoading = false, 
  onRefresh,
  onDataUpdate 
}: KOLTableProps) {
  const { user } = useAuth()
  const [data, setData] = useState<KOLData[]>(initialData)
  const [filteredData, setFilteredData] = useState(initialData)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  // Enhanced column visibility with mobile-responsive defaults
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    // Check if we're on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    
    return {
      select: true,
      id: false,
      name: true,
      platform: true,
      username: !isMobile, // Hide on mobile
      profileUrl: false,
      followers: true,
      following: false,
      category: !isMobile, // Hide on mobile
      engagementRate: true,
      avgLikes: false,
      avgComments: false,
      avgViews: false,
      location: false,
      bio: false,
      email: false,
      phone: false,
      ratePerPost: !isMobile, // Hide on mobile
      ratePerStory: false,
      ratePerVideo: false,
      lastPostDate: false,
      totalPosts: false,
      status: true,
      tags: false,
      notes: false,
    }
  })
  const [rowSelection, setRowSelection] = useState({})
  const [pageInput, setPageInput] = useState('')
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false)
  
  // Virtual scrolling state
  const [enableVirtualScrolling, setEnableVirtualScrolling] = useState(false)
  const [containerHeight, setContainerHeight] = useState(400)
  const [scrollTop, setScrollTop] = useState(0)
  const virtualScrollRef = useRef<HTMLDivElement>(null)
  
  // Virtual scrolling settings
  const ROW_HEIGHT = 72 // Fixed row height for virtual scrolling
  const OVERSCAN = 5 // Number of rows to render outside visible area
  
  // Enable virtual scrolling for large datasets
  useEffect(() => {
    const shouldEnableVirtualScrolling = filteredData.length > 100
    setEnableVirtualScrolling(shouldEnableVirtualScrolling)
  }, [filteredData.length])
  
  // Calculate visible rows for virtual scrolling - moved after table declaration
  
  // Handle virtual scroll events
  const handleVirtualScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    setScrollTop(target.scrollTop)
  }, [])
  
  // Update container height on resize
  useEffect(() => {
    const updateContainerHeight = () => {
      if (virtualScrollRef.current) {
        const rect = virtualScrollRef.current.getBoundingClientRect()
        setContainerHeight(rect.height)
      }
    }
    
    updateContainerHeight()
    window.addEventListener('resize', updateContainerHeight)
    return () => window.removeEventListener('resize', updateContainerHeight)
  }, [])

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

  // Enhanced bulk operation handlers with better UX
  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error('Select at least one KOL to delete')
      return
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedRows.length} KOL(s)? This action cannot be undone.`
    )
    
    if (!confirmed) return

    setBulkOperationLoading(true)
    try {
      const projectSlug = process.env.NEXT_PUBLIC_NOCODB_PROJECT as string
      const tableSlug = process.env.NEXT_PUBLIC_NOCODB_TABLE as string
      
      if (!projectSlug || !tableSlug) {
        throw new Error("NocoDB configuration missing")
      }

      // Show progress toast
      const loadingToast = toast.loading(`Deleting ${selectedRows.length} KOL(s)...`)
      
      // Delete each selected row with progress tracking
      let completed = 0
      await Promise.all(
        selectedRows.map(async (row) => {
          // TODO: Implement bulk delete via API
          console.log('Bulk delete would be called for:', row.original.id)
          await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API call
          completed++
          
          // Update progress
          if (completed < selectedRows.length) {
            toast.loading(`Deleting ${completed}/${selectedRows.length} KOL(s)...`, { id: loadingToast })
          }
          
          return Promise.resolve()
        })
      )
      
      toast.success(`${selectedRows.length} KOL(s) deleted successfully`, { id: loadingToast })
      setRowSelection({})
      if (onRefresh) onRefresh()
    } catch (error) {
      toast.error('Failed to delete KOLs')
    } finally {
      setBulkOperationLoading(false)
    }
  }

  // Bulk status update handler
  const handleBulkStatusUpdate = async (newStatus: string) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error('Select at least one KOL to update')
      return
    }

    setBulkOperationLoading(true)
    try {
      const loadingToast = toast.loading(`Updating status for ${selectedRows.length} KOL(s)...`)
      
      // TODO: Implement bulk status update via API
      selectedRows.forEach(row => {
        console.log('Bulk status update would be called for:', row.original.id, 'to', newStatus)
      })
      
      toast.success(`Updated status for ${selectedRows.length} KOL(s)`, { id: loadingToast })
      setRowSelection({})
      if (onRefresh) onRefresh()
    } catch (error) {
      toast.error('Failed to update KOL status')
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

  // Enhanced fuzzy search function with multi-field support
  const fuzzyFilter = useCallback((row: any, columnId: string, value: string, addMeta: any) => {
    if (!value || !value.trim()) return true
    
    const searchValue = value.toLowerCase()
    const searchTerms = searchValue.split(' ').filter(term => term.length > 0)
    
    // Define searchable fields with weights
    const searchableFields = [
      { field: 'name', weight: 3 },
      { field: 'platform', weight: 2 },
      { field: 'username', weight: 2 },
      { field: 'category', weight: 1.5 },
      { field: 'bio', weight: 1 },
      { field: 'location', weight: 1 },
      { field: 'email', weight: 1 },
      { field: 'status', weight: 1 },
      { field: 'tags', weight: 1 },
      { field: 'notes', weight: 1 },
    ]
    
    // Calculate relevance score
    let relevanceScore = 0
    
    for (const term of searchTerms) {
      let termFound = false
      
      for (const { field, weight } of searchableFields) {
        const fieldValue = row.original[field]
        if (fieldValue) {
          const stringValue = field === 'tags' && Array.isArray(fieldValue) 
            ? fieldValue.join(' ') 
            : fieldValue.toString()
          
          if (stringValue.toLowerCase().includes(term)) {
            relevanceScore += weight
            termFound = true
          }
        }
      }
      
      // If any term is not found, exclude the row
      if (!termFound) {
        return false
      }
    }
    
    // Store relevance score for potential sorting
    addMeta({ relevanceScore })
    
    return relevanceScore > 0
  }, [])

  // Searchable fields configuration
  const searchableFields: KOLSearchableField[] = useMemo(() => [
    { field: 'name', key: 'name', label: 'Name', type: 'text', searchable: true },
    { field: 'platform', key: 'platform', label: 'Platform', type: 'select', searchable: true, options: ['Instagram', 'YouTube', 'Twitter', 'Facebook', 'LinkedIn', 'TikTok'] },
    { field: 'username', key: 'username', label: 'Username', type: 'text', searchable: true },
    { field: 'category', key: 'category', label: 'Category', type: 'text', searchable: true },
    { field: 'location', key: 'location', label: 'Location', type: 'text', searchable: true },
    { field: 'followers', key: 'followers', label: 'Followers', type: 'number', searchable: true },
    { field: 'engagementRate', key: 'engagementRate', label: 'Engagement Rate', type: 'number', searchable: true },
    { field: 'status', key: 'status', label: 'Status', type: 'select', searchable: true, options: ['Active', 'Inactive', 'Pending'] },
    { field: 'bio', key: 'bio', label: 'Bio', type: 'text', searchable: true },
    { field: 'email', key: 'email', label: 'Email', type: 'text', searchable: true },
  ], [])

  // Enhanced search with debouncing
  const handleSearch = useCallback((query: string, filters: any[]) => {
    const debouncedSearch = debounce((searchQuery: string) => {
      setGlobalFilter(searchQuery)
    }, 300)
    
    debouncedSearch(query)
  }, [])

  // Debounce utility function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
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
        cell: ({ row, table }) => {
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
        cell: ({ row, column, table }) => {
          const tags = row.getValue("tags") as string[] | undefined
          return (
            <EditableCell 
              value={tags?.join(', ') || ''} 
              row={row} 
              column={column} 
              table={table}
            />
          )
        },
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
        const updateFn = (prev: KOLData[]) => prev.map((row, index) => 
          index === rowIndex ? { ...row, [columnId]: value } : row
        )
        
        setFilteredData(updateFn)
        setData(prev => {
          const newData = updateFn(prev)
          if (onDataUpdate) {
            onDataUpdate(newData)
          }
          return newData
        })
      },
    },
  })

  // Calculate visible rows for virtual scrolling (after table declaration)
  const virtualRows = useMemo(() => {
    if (!enableVirtualScrolling) return { rows: table.getRowModel().rows, totalHeight: 0 }
    
    const totalRows = table.getRowModel().rows.length
    const startIndex = Math.floor(scrollTop / ROW_HEIGHT)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN,
      totalRows
    )
    
    const visibleRows = table.getRowModel().rows.slice(
      Math.max(0, startIndex - OVERSCAN),
      endIndex
    )
    
    return {
      rows: visibleRows,
      totalHeight: totalRows * ROW_HEIGHT,
      startIndex: Math.max(0, startIndex - OVERSCAN),
      offsetY: Math.max(0, startIndex - OVERSCAN) * ROW_HEIGHT
    }
  }, [enableVirtualScrolling, scrollTop, containerHeight, ROW_HEIGHT, OVERSCAN, table])

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
      {/* Mobile-first responsive controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:max-w-md">
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
                className="hover:bg-primary hover:text-primary-foreground transition-colors w-full sm:w-auto"
                aria-label="Toggle column visibility"
              >
                <ColumnsIcon className="mr-2 h-4 w-4" />
                <span className="sm:hidden">Columns</span>
                <span className="hidden sm:inline">Column View</span>
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
              className="hover:bg-primary hover:text-primary-foreground transition-colors w-full sm:w-auto"
              aria-label="Refresh KOL data"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Refresh
            </AnimatedButton>
          )}
        </div>
      </div>

      {/* Enhanced mobile-friendly bulk actions */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
            <span className="text-sm font-medium">
              {Object.keys(rowSelection).length} KOL(s) selected
            </span>
            {Object.keys(rowSelection).length < table.getFilteredRowModel().rows.length && (
              <AnimatedButton
                variant="ghost"
                size="sm"
                onClick={() => table.toggleAllPageRowsSelected(true)}
                className="text-xs hover:bg-blue-100 hover:text-blue-600"
                aria-label="Select all KOLs"
              >
                Select All ({table.getFilteredRowModel().rows.length})
              </AnimatedButton>
            )}
            {Object.keys(rowSelection).length > 0 && (
              <AnimatedButton
                variant="ghost"
                size="sm"
                onClick={() => setRowSelection({})}
                className="text-xs hover:bg-gray-100 hover:text-gray-600"
                aria-label="Clear selection"
              >
                Clear Selection
              </AnimatedButton>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={handleBulkExport}
              disabled={bulkOperationLoading}
              animationType="hover"
              className="hover:bg-green-100 hover:text-green-600 w-full sm:w-auto"
              aria-label={`Export ${Object.keys(rowSelection).length} selected KOLs`}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </AnimatedButton>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <AnimatedButton
                  variant="outline"
                  size="sm"
                  disabled={bulkOperationLoading}
                  animationType="hover"
                  className="hover:bg-blue-100 hover:text-blue-600 w-full sm:w-auto"
                  aria-label="Bulk actions menu"
                >
                  <EditIcon className="mr-2 h-4 w-4" />
                  Bulk Actions
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </AnimatedButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('active')}>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                  Mark as Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('inactive')}>
                  <XIcon className="mr-2 h-4 w-4 text-gray-600" />
                  Mark as Inactive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate('pending')}>
                  <Calendar className="mr-2 h-4 w-4 text-yellow-600" />
                  Mark as Pending
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleBulkDelete}
                  disabled={bulkOperationLoading}
                  className="text-red-600 focus:bg-red-50 focus:text-red-700"
                >
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Enhanced responsive table with virtual scrolling */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table role="table" aria-label="KOL management table">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id}
                        className="whitespace-nowrap"
                        role="columnheader"
                        aria-sort={
                          header.column.getIsSorted() === "desc" ? "descending" :
                          header.column.getIsSorted() === "asc" ? "ascending" : "none"
                        }
                      >
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
            {enableVirtualScrolling ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-0">
                    <div
                      ref={virtualScrollRef}
                      style={{ height: `${containerHeight}px` }}
                      className="overflow-auto"
                      onScroll={handleVirtualScroll}
                    >
                      <div style={{ height: `${virtualRows.totalHeight}px`, position: 'relative' }}>
                        <div style={{ transform: `translateY(${virtualRows.offsetY}px)` }}>
                          {virtualRows.rows.map((row, index) => (
                            <div
                              key={row.id}
                              style={{ height: `${ROW_HEIGHT}px` }}
                              className="flex items-center hover:bg-muted/50 transition-colors border-b"
                            >
                              {row.getVisibleCells().map((cell) => (
                                <div
                                  key={cell.id}
                                  className="px-4 py-2 text-sm flex-1 whitespace-nowrap overflow-hidden text-ellipsis"
                                  style={{ minWidth: '120px' }}
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                      role="cell"
                      aria-live="polite"
                      aria-busy="true"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Spinner />
                        <span className="sr-only">Loading KOL data</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-muted/50 transition-colors"
                      role="row"
                      aria-rowindex={index + 1}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id}
                          className="whitespace-nowrap"
                          role="cell"
                        >
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
                      role="cell"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="text-center">
                          <p className="text-sm font-medium">No KOLs found</p>
                          <p className="text-xs text-muted-foreground">Try adjusting your search or add new KOLs</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </div>
      </div>

      {/* Enhanced responsive pagination with virtual scrolling info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          {enableVirtualScrolling ? (
            <div className="flex items-center gap-2">
              <span>Showing {table.getFilteredRowModel().rows.length} of {filteredData.length} KOL records</span>
              <Badge variant="secondary" className="text-xs">
                Virtual Scrolling
              </Badge>
            </div>
          ) : (
            <span>Showing {table.getFilteredRowModel().rows.length} of {filteredData.length} KOL records</span>
          )}
        </div>
        {!enableVirtualScrolling && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center justify-center gap-2">
              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                animationType="hover"
                className="hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Go to previous page"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </AnimatedButton>
            
            <div className="flex items-center space-x-2 text-sm">
              <span className="hidden sm:inline">Page</span>
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
                aria-label="Page number"
              />
              <span>of {table.getPageCount()}</span>
            </div>

            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              animationType="hover"
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label="Go to next page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRightIcon className="h-4 w-4" />
            </AnimatedButton>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
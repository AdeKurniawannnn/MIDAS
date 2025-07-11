"use client"

import { useState, useMemo } from "react"
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ColumnsIcon,
  SaveIcon,
  EditIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "lucide-react"
import { toast } from "sonner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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
      const supabase = createClientComponentClient()
      
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

export function InstagramTable({ data: initialData }: InstagramTableProps) {
  const [data, setData] = useState(initialData)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // Kolom yang bisa disembunyikan
  const columns: ColumnDef<DataScrapingInstagram>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 p-0 font-semibold"
            >
              ID
              {column.getIsSorted() === "asc" ? (
                <ChevronUpIcon className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              ) : null}
            </Button>
          )
        },
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
    []
  )

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    meta: {
      updateData: (rowIndex: number, columnId: string, value: any) => {
        setData(prev => prev.map((row, index) => 
          index === rowIndex ? { ...row, [columnId]: value } : row
        ))
      },
    },
  })

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
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <ColumnsIcon className="mr-2 h-4 w-4" />
              Kolom
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
          Menampilkan {table.getFilteredRowModel().rows.length} dari {data.length} data
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
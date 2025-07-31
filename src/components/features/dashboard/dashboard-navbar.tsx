"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/providers/AuthProvider"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  LayoutDashboardIcon, 
  UsersIcon, 
  MegaphoneIcon, 
  LogOutIcon,
  UserIcon,
  SettingsIcon,
  HomeIcon,
  BellIcon,
  TrendingUpIcon,
  HashIcon
} from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"

interface DashboardNavbarProps {
  currentPage?: string
}

export function DashboardNavbar({ currentPage = "Dashboard" }: DashboardNavbarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Berhasil logout. Sampai jumpa!')
      router.push('/')
    } catch (error) {
      console.error('Error during logout:', error)
      toast.error('Gagal logout, silakan coba lagi')
    }
  }

  const navigationItems = [
    //{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
    { name: "Orion", href: "/orion", icon: MegaphoneIcon },
    { name: "Keywords", href: "/keywords", icon: HashIcon },
    { name: "KOL", href: "/kol", icon: UsersIcon },
  ]

  return (
    <header className="navbar sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <TrendingUpIcon className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">MIDAS</span>
          </Link>
          
          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.name
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <div className="hidden lg:flex">
            <ThemeToggle />
          </div>
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <BellIcon className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
              3
            </Badge>
          </Button>

          {/* Back to Home */}
          <Link href="/">
            <Button variant="outline" size="sm" className="hidden md:flex items-center space-x-2">
              <HomeIcon className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/admin.jpg" alt={user?.email || "User"} />
                  <AvatarFallback>
                    {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.nama_lengkap || "Admin"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "admin@midas.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOutIcon className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
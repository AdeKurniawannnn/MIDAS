"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const isDark = theme === "dark"

  if (!mounted) {
    return (
      <div className="w-14 h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <div className="w-5 h-5 bg-white rounded-full" />
      </div>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
        isDark 
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600' 
          : 'bg-gradient-to-r from-yellow-400 to-orange-500'
      }`}
    >
      {/* Track Background */}
      <div className="absolute inset-0 rounded-full opacity-20">
        <div className={`w-full h-full rounded-full ${isDark ? 'bg-gray-900' : 'bg-yellow-100'}`} />
      </div>

      {/* Slider */}
      <motion.div
        className={`relative w-5 h-5 rounded-full shadow-lg flex items-center justify-center ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
        animate={{
          x: isDark ? 24 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      >
        {/* Icon */}
        <motion.div
          animate={{
            scale: isDark ? 1 : 1,
            rotate: isDark ? 0 : 0
          }}
          transition={{
            duration: 0.3
          }}
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-yellow-300" />
          ) : (
            <Sun className="w-3 h-3 text-yellow-600" />
          )}
        </motion.div>
      </motion.div>

      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <Sun className={`w-3 h-3 transition-opacity duration-300 ${isDark ? 'opacity-30' : 'opacity-60'} text-yellow-200`} />
        <Moon className={`w-3 h-3 transition-opacity duration-300 ${isDark ? 'opacity-60' : 'opacity-30'} text-purple-200`} />
      </div>

      <span className="sr-only">Toggle theme</span>
    </button>
  )
} 
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  History,
  X,
  Filter,
  ChevronDown,
  Clock,
  Target,
  Sparkles
} from "lucide-react"

interface FuzzySearchBarProps {
  onSearch: (query: string, filters: SearchFilter[]) => void
  searchableFields: SearchableField[]
  placeholder?: string
  className?: string
}

interface SearchableField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select'
  searchable?: boolean
  options?: string[]
}

interface SearchFilter {
  field: string
  operator: 'contains' | 'equals' | 'greater' | 'less' | 'between'
  value: string | number | boolean
  label: string
}

interface SearchSuggestion {
  text: string
  field: string
  fieldLabel: string
  type: 'field' | 'value' | 'history'
}

export function FuzzySearchBar({
  onSearch,
  searchableFields,
  placeholder = "Search across all fields...",
  className = ""
}: FuzzySearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedHistory = localStorage.getItem('orion-search-history')
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }
  }, [])

  const generateSuggestions = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase()
    const newSuggestions: SearchSuggestion[] = []

    searchableFields.forEach(field => {
      if (field.searchable !== false && field.label.toLowerCase().includes(lowercaseQuery)) {
        newSuggestions.push({
          text: `Search in ${field.label}`,
          field: field.key,
          fieldLabel: field.label,
          type: 'field'
        })
      }
    })

    searchHistory
      .filter(item => item.toLowerCase().includes(lowercaseQuery))
      .slice(0, 3)
      .forEach(item => {
        newSuggestions.push({
          text: item,
          field: '',
          fieldLabel: '',
          type: 'history'
        })
      })

    setSuggestions(newSuggestions.slice(0, 8))
  }, [searchableFields, searchHistory])

  useEffect(() => {
    if (searchQuery.trim()) {
      generateSuggestions(searchQuery)
    } else {
      setSuggestions([])
    }
  }, [searchQuery, generateSuggestions])

  const handleSearch = (query: string = searchQuery) => {
    if (!query.trim()) return

    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('orion-search-history', JSON.stringify(newHistory))

    onSearch(query, activeFilters)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        handleSuggestionSelect(suggestions[selectedSuggestionIndex])
      } else {
        handleSearch()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'field') {
      setSearchQuery(`${suggestion.fieldLabel}:`)
      inputRef.current?.focus()
    } else {
      setSearchQuery(suggestion.text)
      handleSearch(suggestion.text)
    }
  }

  const addFilter = (filter: SearchFilter) => {
    setActiveFilters(prev => [...prev, filter])
  }

  const removeFilter = (index: number) => {
    setActiveFilters(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setSearchQuery("")
    setActiveFilters([])
    onSearch("", [])
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('orion-search-history')
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-20"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <AnimatedButton
                variant="ghost"
                size="sm"
                animationType="scale"
                onClick={() => setSearchQuery("")}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </AnimatedButton>
            )}
            <AnimatedButton
              variant="ghost"
              size="sm"
              animationType="hover"
              onClick={() => handleSearch()}
              className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors"
            >
              <Search className="h-3 w-3" />
            </AnimatedButton>
          </div>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 cursor-pointer hover:bg-accent ${
                    selectedSuggestionIndex === index ? 'bg-accent' : ''
                  }`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-center gap-2">
                    {suggestion.type === 'field' && (
                      <Target className="h-3 w-3 text-blue-500" />
                    )}
                    {suggestion.type === 'history' && (
                      <Clock className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="text-sm">{suggestion.text}</span>
                    {suggestion.type === 'field' && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Field
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {searchHistory.length > 0 && (
              <div className="border-t p-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Search History</span>
                <AnimatedButton
                  variant="ghost"
                  size="sm"
                  animationType="hover"
                  onClick={clearHistory}
                  className="h-6 text-xs hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  Clear
                </AnimatedButton>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {activeFilters.map((filter, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <Filter className="h-3 w-3" />
              {filter.label}
              <AnimatedButton
                variant="ghost"
                size="sm"
                animationType="scale"
                onClick={() => removeFilter(index)}
                className="h-4 w-4 p-0 ml-1 hover:bg-red-100 hover:text-red-600 transition-colors"
              >
                <X className="h-2 w-2" />
              </AnimatedButton>
            </Badge>
          ))}
          <AnimatedButton
            variant="ghost"
            size="sm"
            animationType="hover"
            onClick={clearAll}
            className="h-6 text-xs hover:bg-red-100 hover:text-red-600 transition-colors"
          >
            Clear All
          </AnimatedButton>
        </div>
      )}

      {/* Search Stats */}
      {searchQuery && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>
            Searching across {searchableFields.filter(f => f.searchable !== false).length} fields
          </span>
        </div>
      )}
    </div>
  )
}
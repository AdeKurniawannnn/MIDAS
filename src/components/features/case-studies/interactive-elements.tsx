'use client'

// Advanced interactive elements for case studies
import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Heart, 
  Share2, 
  Bookmark, 
  ExternalLink, 
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Copy,
  Check
} from 'lucide-react'
import { useFavorites, useModal } from './hooks'
import { buttonAnimations, modalAnimations } from './animations'

// Enhanced floating action button with ripple effect
export const FloatingActionButton: React.FC<{
  icon: React.ReactNode
  onClick?: () => void
  className?: string
  ariaLabel?: string
}> = ({ icon, onClick, className = '', ariaLabel }) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const rippleRef = useRef<number>(0)

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick()
    
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = ++rippleRef.current
    
    setRipples(prev => [...prev, { id, x, y }])
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id))
    }, 600)
  }, [onClick])

  return (
    <motion.button
      className={`relative overflow-hidden rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-shadow ${className}`}
      variants={buttonAnimations}
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
      aria-label={ariaLabel}
    >
      <div className="relative z-10 p-3">
        {icon}
      </div>
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: ripple.x - 20,
            top: ripple.y - 20,
            width: 40,
            height: 40
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </motion.button>
  )
}

// Interactive case study card with advanced hover states
export const InteractiveCaseCard: React.FC<{
  caseStudy: any
  onFavorite?: (id: string) => void
  onShare?: (id: string) => void
  onView?: (id: string) => void
}> = ({ caseStudy, onFavorite, onShare, onView }) => {
  const [isHovered, setIsHovered] = useState(false)
  const { isFavorite, toggleFavorite } = useFavorites()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Create magnetic effect
  const cardX = useTransform(mouseX, [-300, 300], [-10, 10])
  const cardY = useTransform(mouseY, [-300, 300], [-10, 10])
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }
  
  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      style={{ x: cardX, y: cardY }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="group relative"
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500">
        <div className="relative h-64 overflow-hidden">
          <Image 
            src={caseStudy.thumbnail}
            alt={caseStudy.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Action buttons with staggered animation */}
          <AnimatePresence>
            {isHovered && (
              <motion.div 
                className="absolute top-4 right-4 flex flex-col gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ staggerChildren: 0.1 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <FloatingActionButton
                    icon={<Heart className={`h-4 w-4 ${isFavorite(caseStudy.id) ? 'fill-current' : ''}`} />}
                    onClick={() => {
                      toggleFavorite(caseStudy.id)
                      onFavorite?.(caseStudy.id)
                    }}
                    className="h-10 w-10"
                    ariaLabel="Add to favorites"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <FloatingActionButton
                    icon={<Share2 className="h-4 w-4" />}
                    onClick={() => onShare?.(caseStudy.id)}
                    className="h-10 w-10"
                    ariaLabel="Share case study"
                  />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <FloatingActionButton
                    icon={<ExternalLink className="h-4 w-4" />}
                    onClick={() => onView?.(caseStudy.id)}
                    className="h-10 w-10"
                    ariaLabel="View details"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Category badge with bounce effect */}
          <motion.div 
            className="absolute bottom-4 left-4"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Badge className="bg-primary/90 backdrop-blur-sm border border-white/20">
              {caseStudy.category.replace('-', ' ')}
            </Badge>
          </motion.div>
        </div>
        
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
            {caseStudy.title}
          </h3>
          <p className="text-muted-foreground line-clamp-2">
            {caseStudy.description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Progressive loading placeholder with skeleton animation
export const SkeletonCard: React.FC = () => {
  return (
    <Card className="overflow-hidden">
      <div className="h-64 bg-muted animate-pulse" />
      <CardContent className="p-6 space-y-4">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
      </CardContent>
    </Card>
  )
}

// Enhanced share modal with copy functionality
export const ShareModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  caseStudy: any
}> = ({ isOpen, onClose, caseStudy }) => {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? `${window.location.origin}/case-studies/${caseStudy?.id}` : `/case-studies/${caseStudy?.id}`
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [url])
  
  const shareOptions = [
    {
      name: 'Twitter',
      color: 'bg-blue-500',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out: ${caseStudy?.title}`)}&url=${encodeURIComponent(url)}`, '_blank')
        }
      }
    },
    {
      name: 'LinkedIn',
      color: 'bg-blue-700',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
        }
      }
    },
    {
      name: 'Facebook',
      color: 'bg-blue-600',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        }
      }
    }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
            variants={modalAnimations}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Card className="w-96 p-6">
              <h3 className="text-lg font-semibold mb-4">Share Case Study</h3>
              
              {/* URL copy section */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Copy Link</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={url} 
                    readOnly 
                    className="flex-1 px-3 py-2 text-sm bg-muted border rounded-md"
                  />
                  <Button
                    size="sm"
                    onClick={handleCopy}
                    className="gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              
              {/* Social sharing */}
              <div className="space-y-3">
                <label className="text-sm font-medium block">Share on Social Media</label>
                <div className="grid grid-cols-3 gap-3">
                  {shareOptions.map((option, index) => (
                    <motion.button
                      key={option.name}
                      className={`p-3 rounded-lg text-white font-medium ${option.color} hover:opacity-90 transition-opacity`}
                      onClick={option.onClick}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {option.name}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-6" 
                onClick={onClose}
              >
                Close
              </Button>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Animated progress indicator
export const ProgressIndicator: React.FC<{
  value: number
  max: number
  label?: string
  color?: string
}> = ({ value, max, label, color = 'bg-primary' }) => {
  const percentage = (value / max) * 100
  
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

const interactiveElements = {
  FloatingActionButton,
  InteractiveCaseCard,
  SkeletonCard,
  ShareModal,
  ProgressIndicator
}

export default interactiveElements
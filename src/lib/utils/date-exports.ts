// Optimized date exports with tree-shaking
// Only import specific functions instead of entire library

export {
  format,
  formatDistanceToNow,
  isValid,
  startOfDay,
  endOfDay,
  addDays,
  subDays
} from 'date-fns'

// Common date formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  TIME: 'HH:mm:ss'
} as const

// Simple formatter function - no external dependencies
export const formatDate = (date: Date | string | number, formatStr: string = DATE_FORMATS.SHORT) => {
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date')
    }

    // Simple formatting - fallback to toDateString() if no format specified
    switch (formatStr) {
      case DATE_FORMATS.SHORT:
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      case DATE_FORMATS.LONG:
        return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      case DATE_FORMATS.ISO:
        return dateObj.toISOString().split('T')[0]
      case DATE_FORMATS.TIME:
        return dateObj.toTimeString().split(' ')[0]
      default:
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  } catch (error) {
    console.error('Date formatting error:', error)
    return 'Invalid date'
  }
}
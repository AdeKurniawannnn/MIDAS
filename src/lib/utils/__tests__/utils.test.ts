import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    test('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toContain('class1')
      expect(cn('class1', 'class2')).toContain('class2')
    })

    test('handles conditional classes', () => {
      expect(cn('base', true && 'conditional')).toContain('conditional')
      expect(cn('base', false && 'conditional')).not.toContain('conditional')
    })

    test('handles undefined and null values', () => {
      expect(cn('class1', undefined, 'class2')).toContain('class1')
      expect(cn('class1', null, 'class2')).toContain('class2')
    })

    test('handles empty string and empty array', () => {
      expect(cn('class1', '', 'class2')).toContain('class1')
      expect(cn('class1', [], 'class2')).toContain('class2')
    })

    test('handles object-style classes', () => {
      expect(cn({ 'class1': true, 'class2': false })).toContain('class1')
      expect(cn({ 'class1': true, 'class2': false })).not.toContain('class2')
    })

    test('handles complex combinations', () => {
      const result = cn(
        'base-class',
        { 'conditional-class': true },
        ['array-class'],
        'final-class'
      )
      expect(result).toContain('base-class')
      expect(result).toContain('conditional-class')
      expect(result).toContain('array-class')
      expect(result).toContain('final-class')
    })

    test('handles tailwind class conflicts', () => {
      // This test assumes tailwind-merge is handling conflicts
      const result = cn('p-4', 'p-8')
      // tailwind-merge should keep only the last padding class
      expect(result).toContain('p-8')
      expect(result).not.toContain('p-4')
    })

    test('returns empty string for no input', () => {
      expect(cn()).toBe('')
    })
  })
})
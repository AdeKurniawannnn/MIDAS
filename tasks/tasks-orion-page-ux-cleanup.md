# Task List: Orion Page UX & Architecture Cleanup

**Based on Analysis:** Orion page UX review and duplicate component analysis
**Created:** 2025-08-31
**Status:** Not Started

## Overview
Comprehensive cleanup of the Orion page to eliminate duplicate components, improve user experience, fix architectural issues, and streamline the data scraping workflow. This addresses critical code duplication, confusing UI patterns, and poor data refresh strategies.

## Main Tasks

### 1. Remove Duplicate Component Architecture
- [ ] Analyze import paths and component usage across the application
- [ ] Delete duplicate EnhancedOrionClient in `/src/components/features/orion/`
- [ ] Delete duplicate OrionClient in `/src/components/features/orion/`
- [ ] Remove entire `/src/components/features/orion/` directory structure
- [ ] Update any remaining imports to use canonical `/src/features/orion/components/` paths
- [ ] Verify all components still export properly from feature index files

### 2. Simplify and Streamline User Interface
- [ ] Remove redundant "Add Keyword" button from main action bar
- [ ] Remove confusing "Quick Scrape" button that duplicates "New Scraping"
- [ ] Replace "New Instagram Scraping" and "New Google Maps" buttons with single dropdown
- [ ] Remove floating action button that duplicates main actions
- [ ] Create single primary CTA: "Start New Scraping" with platform selection
- [ ] Move "Add Keyword" to secondary/contextual location

### 3. Fix Data Refresh and State Management
- [ ] Replace `window.location.reload()` calls with proper state updates
- [ ] Implement optimistic UI updates for new scraping data
- [ ] Add proper loading states during data operations
- [ ] Implement toast notifications for success/error feedback
- [ ] Preserve user scroll position and active tab during updates
- [ ] Add proper error handling with retry mechanisms

### 4. Consolidate Information Architecture
- [ ] Remove duplicate tab system in ResizableSidebar scraping panel
- [ ] Replace ResizableSidebar with focused modal dialog
- [ ] Consolidate record count displays (remove redundant counters)
- [ ] Improve visual hierarchy between data display and actions
- [ ] Create clearer separation between viewing data and creating new data
- [ ] Simplify navigation flow for scraping operations

### 5. Enhance Code Organization and Maintainability
- [ ] Replace multiple useState hooks with useReducer for complex state
- [ ] Fix import dependency chains and circular references
- [ ] Implement proper TypeScript interfaces for component props
- [ ] Add proper ARIA labels and keyboard navigation support
- [ ] Extract reusable logic into custom hooks
- [ ] Add comprehensive error boundaries for component isolation

## Relevant Files

### Existing Files to Modify
- `src/app/(dashboard)/orion/page.tsx` - Update imports and data fetching
- `src/features/orion/components/enhanced-orion-client.tsx` - Major UX simplification
- `src/features/orion/components/index.ts` - Ensure proper exports
- `src/features/orion/index.ts` - Verify component exports

### Files to Delete
- `src/components/features/orion/enhanced-orion-client.tsx` - Duplicate component
- `src/components/features/orion/orion-client.tsx` - Duplicate component
- `src/components/features/orion/index.ts` - Duplicate export file
- Entire `src/components/features/orion/` directory - Remove duplicate structure

### Test Files
- `src/features/orion/components/__tests__/enhanced-orion-client.test.tsx` - Component behavior tests
- `src/features/orion/components/__tests__/state-management.test.tsx` - State management tests

## Notes
- Start with Phase 1 (duplicate removal) as it blocks effective development
- Test thoroughly after each phase to ensure no regressions
- Consider user feedback on simplified action patterns
- Maintain backward compatibility for any external API calls
- Document new component architecture for future developers
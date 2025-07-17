# MIDAS Testing Documentation

## Overview

This document outlines the comprehensive testing strategy for the MIDAS project, including unit tests, integration tests, end-to-end tests, and performance testing.

## Testing Stack

### Core Testing Libraries
- **Jest**: Unit and integration testing framework
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end browser testing
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Additional Jest matchers

### Coverage Tools
- **Jest Coverage**: Built-in coverage reporting
- **HTML Reports**: Visual coverage reports
- **LCOV**: Coverage data format for CI/CD integration

## Test Categories

### 1. Unit Tests (`npm test`)
Test individual components and utility functions in isolation.

**Location**: `src/**/__tests__/`, `src/**/*.test.{ts,tsx}`

**Coverage Targets**:
- Functions: 70%
- Branches: 70%
- Lines: 70%
- Statements: 70%

**Examples**:
```bash
npm test                    # Run all unit tests
npm run test:watch         # Watch mode for development
npm run test:ui           # UI component tests only
npm run test:unit         # Utility function tests only
```

### 2. Integration Tests (`npm run test:integration`)
Test API routes and database operations.

**Location**: `src/app/api/__tests__/`

**Coverage**:
- API route handlers
- Database operations
- Authentication middleware
- Error handling

### 3. End-to-End Tests (`npm run test:e2e`)
Test complete user workflows across multiple browsers.

**Location**: `tests/e2e/`

**Coverage**:
- User authentication flows
- Dashboard navigation
- Form submissions
- Mobile responsiveness
- Performance metrics

**Browsers Tested**:
- Chrome (Desktop & Mobile)
- Firefox
- Safari (Desktop & Mobile)

### 4. Production Tests (`npm run test:prod`)
Test production database connectivity and operations.

**⚠️ Warning**: These tests run against production data. Use with caution.

**Features**:
- Database connection validation
- Authentication flow testing
- Data integrity checks
- Cleanup procedures

## Quick Start

### Running All Tests
```bash
# Comprehensive test suite
npm run test:all

# Individual test categories
npm test                    # Unit tests
npm run test:integration   # API tests  
npm run test:e2e          # End-to-end tests
npm run test:coverage     # Coverage report
```

### Development Workflow
```bash
# Start development with tests
npm run test:watch        # Auto-run tests on file changes
npm run dev               # Start development server (separate terminal)

# Before committing
npm run test:coverage     # Check coverage
npm run lint              # Check code style
npm run build             # Verify build success
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: jsdom for browser simulation
- **Module Mapping**: `@/` → `src/` for clean imports
- **Setup Files**: Global test setup in `jest.setup.js`
- **Coverage**: Excludes layout files and types

### Playwright Configuration (`playwright.config.ts`)
- **Base URL**: http://localhost:3000
- **Browsers**: Chrome, Firefox, Safari, Mobile
- **Reports**: HTML reports with screenshots and videos
- **Parallel Execution**: Optimized for CI/CD

### Environment Setup
```bash
# Required for full functionality
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional for admin operations
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## Writing Tests

### Unit Test Example
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  test('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/')
  await page.click('button:has-text("Login")')
  
  await page.fill('input[type="email"]', 'test@gmail.com')
  await page.fill('input[type="password"]', 'Test123')
  await page.click('button:has-text("Submit")')
  
  await expect(page).toHaveURL(/dashboard/)
})
```

### API Test Example
```typescript
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/keywords/route'

describe('Keywords API', () => {
  test('returns keywords list', async () => {
    const request = new NextRequest('http://localhost:3000/api/keywords')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    expect(await response.json()).toHaveProperty('success', true)
  })
})
```

## Continuous Integration

### Pre-commit Hooks
```bash
# Recommended pre-commit script
npm run lint              # Code style check
npm test                  # Unit tests
npm run build             # Build verification
```

### CI/CD Pipeline
```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm install
    npm run test:coverage
    npm run test:e2e
    npm run build
```

## Performance Testing

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Load Testing
```typescript
test('page loads within acceptable time', async ({ page }) => {
  const startTime = Date.now()
  await page.goto('/')
  const loadTime = Date.now() - startTime
  
  expect(loadTime).toBeLessThan(3000)
})
```

## Coverage Reports

### Viewing Coverage
```bash
npm run test:coverage                    # Generate report
open coverage/lcov-report/index.html    # View in browser
```

### Coverage Thresholds
- **Global minimum**: 70% across all metrics
- **Critical components**: 90% coverage required
- **Utility functions**: 95% coverage required

## Troubleshooting

### Common Issues

#### Environment Variables Missing
```bash
# Solution: Copy and configure environment file
cp .env.example .env.local
# Fill in your Supabase credentials
```

#### Tests Failing in CI
```bash
# Check environment setup
npm run check-env

# Verify all dependencies
npm install

# Run tests locally first
npm run test:all
```

#### E2E Tests Timeout
```bash
# Install browsers
npx playwright install

# Check development server
npm run dev
```

#### Mock Issues
- Ensure mocks are properly configured in `jest.setup.js`
- Check module paths in `jest.config.js`
- Verify TypeScript types for mocked modules

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* npm test

# E2E tests with UI mode
npm run test:e2e:ui

# Specific test file
npm test -- button.test.tsx
```

## Best Practices

### Test Organization
- **Group related tests** using `describe` blocks
- **Use descriptive test names** that explain the expected behavior
- **Follow AAA pattern**: Arrange, Act, Assert

### Test Data
- **Use meaningful test data** that represents real scenarios
- **Clean up after tests** to prevent interference
- **Mock external dependencies** for reliable tests

### Performance
- **Run tests in parallel** when possible
- **Use selective testing** during development
- **Cache dependencies** in CI/CD environments

### Maintenance
- **Update tests** when features change
- **Monitor coverage trends** over time
- **Refactor tests** alongside production code

## Future Enhancements

### Planned Improvements
- [ ] Visual regression testing
- [ ] API contract testing
- [ ] Performance benchmarking
- [ ] Accessibility testing automation
- [ ] Cross-browser compatibility matrix

### Tools Under Consideration
- **Storybook**: Component documentation and testing
- **MSW (Mock Service Worker)**: API mocking
- **Testing Library Queries**: Enhanced element selection
- **Lighthouse CI**: Automated performance monitoring

---

For more information, see the individual test files and configuration documentation.
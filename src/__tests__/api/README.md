# API Integration Tests

This directory contains comprehensive integration tests for the API routes, replacing the previous "testing theater" with real integration tests that provide meaningful confidence in the API functionality.

## Test Strategy Summary

### Approach
- **Real Integration Testing**: Tests actual API route handlers with database operations
- **Business Logic Focus**: Validates actual business rules, not mock behavior  
- **Comprehensive Coverage**: Tests happy paths, error scenarios, edge cases, and security
- **Authentication Testing**: Validates user isolation and authorization
- **Performance Validation**: Includes performance assertions for critical paths

### Test Structure

#### 1. Keywords API Tests (`keywords.test.ts`)
**Coverage**: `/api/keywords/*` endpoints
- **GET**: Fetch with filtering, pagination, search
- **POST**: Create with validation, sanitization, defaults
- **PUT**: Update with authorization checks
- **DELETE**: Delete with user ownership validation
- **Authentication**: User isolation and session management
- **Security**: SQL injection prevention, input validation
- **Edge Cases**: Long inputs, malformed data, boundary conditions

#### 2. Scraping API Tests (`scraping.test.ts`)  
**Coverage**: `/api/scraping` endpoint
- **Webhook Integration**: Real webhook calls with mock responses
- **Platform Logic**: Instagram vs Google Maps routing
- **Data Validation**: URL formats, scraping types, coordinates
- **Error Handling**: Timeouts, 404s, server errors, authentication failures
- **Security**: Webhook URL injection prevention
- **Performance**: Concurrent requests, timeout handling

#### 3. Authentication Integration Tests (`auth-integration.test.ts`)
**Coverage**: Cross-API authentication flows
- **Route Protection**: Access control across all endpoints
- **User Data Isolation**: Ensures users only see their own data
- **Session Management**: Header-based and fallback authentication
- **Authorization**: Cross-user data modification prevention
- **Permission Edge Cases**: User switching, privilege escalation attempts

#### 4. Bulk Operations Tests (`bulk-operations.test.ts`)
**Coverage**: `/api/keywords/bulk` endpoint
- **Bulk Status Updates**: Activate, deactivate, archive operations
- **Bulk Deletion**: Multi-record deletion with authorization
- **Transaction Handling**: Data consistency during bulk operations
- **Performance**: Large dataset handling, concurrent operations
- **Error Recovery**: Partial failure scenarios

## Testing Patterns Implemented

### 1. Real Database Operations
```typescript
// Before: Mock behavior
expect(mockDb.insert).toHaveBeenCalled()

// After: Real business logic
const { data } = await testSupabase.from('keywords').insert(testData)
expect(data.keyword).toBe('expected-value')
```

### 2. Comprehensive Error Scenarios
- Validation failures (missing fields, invalid formats)
- Network errors (timeouts, connection failures) 
- Database errors (constraint violations, connection issues)
- Authentication failures (missing tokens, expired sessions)
- Authorization failures (cross-user access attempts)

### 3. Edge Case Coverage
- Boundary values (empty strings, max lengths, null values)
- Malformed inputs (invalid JSON, SQL injection attempts)
- Performance limits (large datasets, concurrent requests)
- System conditions (database unavailability, memory constraints)

### 4. Security Testing
- **Authentication**: Session validation and user identification
- **Authorization**: User data isolation and ownership checks
- **Input Sanitization**: SQL injection and XSS prevention  
- **Rate Limiting**: Concurrent request handling
- **Data Validation**: Input format and constraint checking

## Test Infrastructure

### Setup & Teardown
- Clean database state before each test
- Isolated test user data
- Mock external services (webhooks, APIs)
- Performance monitoring and cleanup

### Database Management
```typescript
beforeEach(async () => {
  await cleanupTestData() // Clean slate for each test
})

afterEach(async () => {
  await cleanupTestData() // Cleanup test artifacts
})
```

### Mock Strategy
- **External APIs**: Mock webhook calls and external services
- **Database**: Use real database operations for business logic validation
- **Authentication**: Configurable user contexts for testing

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific API tests
npm run test -- --testPathPatterns="src/app/api/__tests__"

# Run with coverage
npm run test:integration:coverage

# Run specific test file
npm run test -- --testPathPatterns="keywords.test.ts"
```

## Coverage Goals & Results

### Target Coverage
- **API Routes**: 25%+ coverage (up from 0.84%)
- **Critical Paths**: 90%+ coverage for core business logic
- **Error Scenarios**: 80%+ coverage for error handling

### Coverage Areas
- ✅ **CRUD Operations**: Create, Read, Update, Delete for keywords
- ✅ **Authentication**: User session and authorization logic
- ✅ **Validation**: Input validation and sanitization
- ✅ **Error Handling**: Graceful error responses and recovery
- ✅ **Security**: Authorization and input security
- ✅ **Performance**: Response times and concurrent handling

## Test Quality Metrics

### Test Clarity
- Descriptive test names that explain business scenarios
- Clear test structure with Arrange-Act-Assert pattern
- Meaningful failure messages with context

### Test Reliability  
- Isolated tests that don't depend on each other
- Consistent setup/teardown for clean state
- Deterministic assertions without timing dependencies

### Test Maintainability
- Shared test utilities and fixtures
- Documented test patterns and conventions
- Easy addition of new test scenarios

## Future Improvements

### Automation
- CI/CD integration for automated test runs
- Performance regression detection
- Coverage threshold enforcement

### Additional Testing
- Load testing for performance validation
- End-to-end user workflow testing
- Security penetration testing automation

### Monitoring
- Test execution time tracking
- Flaky test detection and resolution
- Coverage trend monitoring

## Test Development Guidelines

### When Adding New Tests
1. Follow existing test patterns and structure
2. Include both positive and negative test cases
3. Test boundary conditions and edge cases  
4. Validate security and authorization scenarios
5. Ensure tests are isolated and deterministic

### Test Naming Convention
```typescript
describe('API Endpoint - Operation', () => {
  test('should [expected behavior] when [condition]', () => {
    // Test implementation
  })
})
```

### Error Testing Pattern
```typescript
test('should handle [error condition] gracefully', async () => {
  // Setup error condition
  // Execute operation
  // Verify graceful error handling
  // Validate error message clarity
})
```

This testing approach provides real confidence in API functionality while maintaining good performance and clear failure diagnostics. The tests serve as living documentation of the API behavior and catch regressions before they reach production.
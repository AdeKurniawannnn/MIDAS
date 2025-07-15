# Production Database Testing Guide

This guide shows how to test the MIDAS application against the production database safely.

## ⚠️ Important Warning

**These tests run against the PRODUCTION database!**
- Test data will be created and deleted
- Use only in controlled environments
- Ensure you have database backups
- Never run destructive tests in production

## Quick Start

### 1. Environment Setup

The testing environment is configured in `.env.test`:
```bash
NEXT_PUBLIC_SUPABASE_URL=http://supabasekong-joc0wg4wkwo8o48swgswgo0g.217.15.164.63.sslip.io
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### 2. Available Testing Commands

```bash
# Manual interactive testing
npm run test:manual

# Automated production tests
npm run test:prod

# Development mode with test environment
npm run test:dev

# Build with test environment
npm run test:build
```

## Manual Testing Tool

Run the interactive testing tool:

```bash
npm run test:manual
```

Available commands:
1. **Test Database Connection** - Verify connection to production database
2. **Create Test User** - Create a test user in production database
3. **Test User Login** - Test login with existing user
4. **List Test Users** - Show all test users in database
5. **Clean Test Data** - Remove all test users from database
6. **Test Registration Flow** - Full registration and login test
7. **Test Data Scraping** - Test Instagram scraping functionality
8. **Database Stats** - Show database statistics

## Automated Testing

Run comprehensive automated tests:

```bash
npm run test:prod
```

This will:
- Test database connection
- Test authentication flow
- Test CRUD operations
- Test data integrity
- Clean up test data

## Test Categories

### 1. Database Connection Tests
- Verify Supabase connection
- Test authentication
- Check table access

### 2. Authentication Flow Tests
- User registration
- User login
- Password validation
- Session management

### 3. CRUD Operation Tests
- Create operations
- Read operations
- Update operations
- Delete operations

### 4. Data Integrity Tests
- Foreign key constraints
- Data validation
- Error handling

## Test Data Management

### Creating Test Users
Test users are created with email patterns like:
- `test-{timestamp}@example.com`
- `manual-test-{timestamp}@example.com`

### Cleaning Test Data
All test users can be cleaned up using:
```bash
npm run test:manual
# Then choose option 5: Clean Test Data
```

## Safety Features

### Test Data Isolation
- Test users have specific email patterns
- Easy to identify and clean up
- No impact on real user data

### Confirmation Prompts
- All destructive operations require confirmation
- Clear warnings before running tests
- Easy to cancel operations

### Error Handling
- Comprehensive error logging
- Graceful failure handling
- Detailed error messages

## Example Test Flow

1. **Start testing tool:**
   ```bash
   npm run test:manual
   ```

2. **Test connection:**
   Choose option 1 to verify database connectivity

3. **Create test user:**
   Choose option 2 to create a test user

4. **Test login:**
   Choose option 3 to test login with the created user

5. **Clean up:**
   Choose option 5 to remove all test data

## Troubleshooting

### Connection Issues
- Check environment variables in `.env.test`
- Verify Supabase URL and keys
- Check network connectivity

### Authentication Errors
- Verify user credentials
- Check password validation rules
- Confirm user exists in database

### Database Errors
- Check table schemas
- Verify permissions
- Review error logs

## Best Practices

1. **Always clean up test data** after testing
2. **Use test-specific email patterns** for easy identification
3. **Run tests in isolated environments** when possible
4. **Monitor database performance** during tests
5. **Keep test data minimal** to avoid bloating the database

## Security Notes

- Never commit real credentials to version control
- Use environment variables for sensitive data
- Rotate keys regularly
- Monitor database access logs
- Limit test user permissions

## Support

For issues or questions about production testing:
1. Check the error logs
2. Review the troubleshooting section
3. Contact the development team
4. Document any new issues found
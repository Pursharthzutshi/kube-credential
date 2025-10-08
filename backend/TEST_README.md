# Backend Services Unit Tests

This directory contains comprehensive unit tests for both the issuance and verification services.

## Test Structure

### Issuance Service Tests (`backend/issuance-service/src/_tests_/`)

- **`issuance.test.ts`** - Main integration tests for the issuance API endpoints
- **`app.test.ts`** - Unit tests for the Express app configuration
- **`db.test.ts`** - Unit tests for database connection and operations
- **`test-utils.ts`** - Shared test utilities and mock helpers

### Verification Service Tests (`backend/verification-service/src/_tests_/`)

- **`verification.test.ts`** - Main integration tests for the verification API endpoints
- **`app.test.ts`** - Unit tests for the Express app configuration
- **`db.test.ts`** - Unit tests for database connection and operations
- **`test-utils.ts`** - Shared test utilities and mock helpers

## Test Coverage

### Issuance Service
- ✅ POST `/issue` endpoint
  - Successfully issue new credentials
  - Handle duplicate credentials
  - Validate input data
  - Handle database errors
  - Handle MongoDB duplicate key errors
  - Worker ID generation
- ✅ GET `/health` endpoint
- ✅ App configuration and middleware
- ✅ Database connection and operations

### Verification Service
- ✅ POST `/verify` endpoint
  - Verify existing credentials
  - Handle non-existent credentials
  - Validate input data
  - Handle database errors
  - Worker ID generation
- ✅ GET `/health` endpoint
- ✅ App configuration and middleware
- ✅ Database connection and operations

## Running Tests

### Individual Service Tests
```bash
# Issuance service
cd backend/issuance-service
npm test

# Verification service
cd backend/verification-service
npm test
```

### Test Commands
- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests for CI/CD pipeline

### All Services Tests
```bash
# From project root
cd backend/issuance-service && npm test && cd ../verification-service && npm test
```

## Test Features

- **Mocked Dependencies**: MongoDB operations are mocked for isolated unit testing
- **Environment Variable Testing**: Tests verify behavior with different environment configurations
- **Error Handling**: Comprehensive error scenario testing
- **Input Validation**: Tests for various invalid input scenarios
- **Worker ID Generation**: Tests for consistent worker ID behavior
- **Database Operations**: Tests for connection, queries, and error handling

## Mock Utilities

The test utilities provide:
- `createMockCredential()` - Generate test credential objects
- `createMockIssuedCredential()` - Generate test issued credential objects
- `mockMongoCollection` - Mock MongoDB collection operations
- `setupMongoMocks()` - Setup MongoDB mocks
- `resetEnvironmentVariables()` - Environment variable management for tests
- `expectValidTimestamp()` - Validate timestamp format
- `expectValidWorkerId()` - Validate worker ID format

## Dependencies

All necessary testing dependencies are included:
- `jest` - Testing framework
- `supertest` - HTTP assertion library
- `ts-jest` - TypeScript support for Jest
- `@types/jest` - TypeScript definitions for Jest
- `@types/supertest` - TypeScript definitions for Supertest

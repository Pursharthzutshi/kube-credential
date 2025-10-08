# Frontend Unit Tests

This document provides a comprehensive overview of the unit tests created for the frontend React application.

## Test Infrastructure

### Dependencies Installed
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers for DOM elements
- `@testing-library/user-event` - User interaction simulation
- `jest` - JavaScript testing framework
- `jest-environment-jsdom` - Browser environment simulation for Jest
- `@types/jest` - TypeScript definitions for Jest
- `ts-jest` - TypeScript support for Jest
- `identity-obj-proxy` - CSS module mocking

### Configuration Files
- **`jest.config.cjs`** - Jest configuration with TypeScript and React support
- **`src/setupTests.ts`** - Test setup and environment configuration

## Test Files Created

### 1. **API Tests** (`src/__tests__/api.test.ts`)
**Purpose**: Test API functions for credential issuance and verification

**Test Coverage**:
- ✅ `issueCredential()` function
  - Successful credential issuance
  - API error handling
  - Network error handling
  - Unknown error handling
- ✅ `verifyCredential()` function
  - Successful credential verification
  - Verification failure handling
  - Server error handling
  - Network error handling
- ✅ Environment variable handling
  - Default URL fallbacks
  - Custom URL configuration

**Key Features**:
- Mocked axios instances for isolated testing
- Comprehensive error scenario coverage
- Environment variable testing

### 2. **App Component Tests** (`src/__tests__/App.test.tsx`)
**Purpose**: Test the main App component and navigation

**Test Coverage**:
- ✅ Component rendering
- ✅ Navigation functionality
  - Default page display (issuance)
  - Page switching (issue ↔ verify)
  - Button interactions
- ✅ UI elements
  - Navigation buttons
  - Page content switching
  - Styling verification

**Key Features**:
- Mocked child components
- User interaction testing
- Navigation state management

### 3. **IssuancePage Tests** (`src/__tests__/IssuancePage.test.tsx`)
**Purpose**: Test credential issuance functionality

**Test Coverage**:
- ✅ Form rendering and structure
- ✅ Input field interactions
  - Text input handling
  - Form validation
  - Placeholder verification
- ✅ API integration
  - Successful credential issuance
  - Error handling
  - Loading states
- ✅ Data processing
  - JSON subject parsing
  - Default value handling
  - Invalid JSON handling
- ✅ UI states
  - Loading indicators
  - Result display
  - Error messages

**Key Features**:
- Comprehensive form testing
- API mock integration
- User event simulation
- Error scenario coverage

### 4. **VerificationPage Tests** (`src/__tests__/VerificationPage.test.tsx`)
**Purpose**: Test credential verification functionality

**Test Coverage**:
- ✅ Form rendering and structure
- ✅ Input handling
  - Credential ID input
  - Form submission
- ✅ API integration
  - Successful verification
  - Verification failure
  - Error handling
- ✅ UI states
  - Loading indicators
  - Result display
  - Error messages
- ✅ Form behavior
  - Empty field handling
  - Multiple submissions

**Key Features**:
- Form submission testing
- API response handling
- User interaction simulation
- Error state management

### 5. **VerifyPage Tests** (`src/__tests__/VerifyPage.test.tsx`)
**Purpose**: Test the alternative verification page component

**Test Coverage**:
- ✅ Component rendering
- ✅ Form interactions
- ✅ API integration
  - Success scenarios
  - Error scenarios
  - Network failures
- ✅ UI states
  - Loading states
  - Disabled states
  - Result display
- ✅ Error handling
  - String errors
  - Object errors
  - Complex responses

**Key Features**:
- Button state management
- Error message display
- Complex response handling
- User interaction testing

## Test Configuration

### Jest Configuration (`jest.config.cjs`)
```javascript
{
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  // ... additional configuration
}
```

### Test Setup (`src/setupTests.ts`)
- Jest DOM matchers setup
- Environment variable configuration
- Console output management
- Test environment preparation

## Running Tests

### Available Scripts
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI/CD
npm run test:ci
```

### Individual Test Files
```bash
# Run specific test file
npm test -- --testPathPatterns=App.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="API"
```

## Test Coverage

### Components Tested
- ✅ **App.tsx** - Main application component
- ✅ **IssuancePage.tsx** - Credential issuance form
- ✅ **VerificationPage.tsx** - Credential verification form
- ✅ **VerifyPage.tsx** - Alternative verification component
- ✅ **api.ts** - API functions

### Functionality Covered
- ✅ **User Interactions**
  - Form input handling
  - Button clicks
  - Navigation
  - Form submissions
- ✅ **API Integration**
  - HTTP requests
  - Response handling
  - Error scenarios
  - Loading states
- ✅ **UI States**
  - Loading indicators
  - Error messages
  - Success states
  - Disabled states
- ✅ **Data Processing**
  - JSON parsing
  - Form validation
  - Default values
  - Input sanitization

### Error Scenarios
- ✅ Network errors
- ✅ API errors
- ✅ Invalid input
- ✅ Missing data
- ✅ Server failures
- ✅ Timeout scenarios

## Mock Strategy

### API Mocking
- **Axios instances** - Mocked for isolated testing
- **HTTP responses** - Simulated success and error scenarios
- **Network conditions** - Timeout and connection errors

### Component Mocking
- **Child components** - Mocked to focus on parent component logic
- **External dependencies** - Isolated for unit testing
- **CSS modules** - Mocked with identity-obj-proxy

### Environment Mocking
- **Environment variables** - Controlled test environment
- **Console methods** - Suppressed for clean test output
- **Browser APIs** - Simulated with jsdom

## Best Practices Implemented

### Test Structure
- **Arrange-Act-Assert** pattern
- **Descriptive test names**
- **Isolated test cases**
- **Comprehensive coverage**

### Mock Management
- **Proper cleanup** with `beforeEach`
- **Focused mocking** of specific dependencies
- **Realistic mock data**
- **Error scenario simulation**

### User Experience Testing
- **Real user interactions** with user-event
- **Accessibility considerations**
- **Form validation testing**
- **Loading state verification**

## Integration with CI/CD

The test suite is designed to work seamlessly with CI/CD pipelines:
- **Non-interactive mode** with `--ci` flag
- **Coverage reporting** for quality gates
- **Fast execution** for quick feedback
- **Reliable results** with proper mocking

## Future Enhancements

### Potential Additions
- **E2E testing** with Playwright or Cypress
- **Visual regression testing**
- **Performance testing**
- **Accessibility testing**

### Coverage Improvements
- **Edge case scenarios**
- **Integration testing**
- **Error boundary testing**
- **Router testing**

This comprehensive test suite ensures the frontend application is robust, reliable, and maintainable while providing confidence in the user experience and functionality.

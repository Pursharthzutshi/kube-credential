import '@testing-library/jest-dom';

process.env.VITE_ISSUANCE_URL = 'http://localhost:4001';
process.env.VITE_VERIFY_URL = 'http://localhost:4002';

const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
  
  console.log = (...args: any[]) => {
    // Suppress console.log in tests unless specifically needed
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

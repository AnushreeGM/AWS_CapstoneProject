// Jest setup file for backend tests

// Global test setup
beforeAll(() => {
  // Setup before all tests
  console.log('🧪 Starting backend test suite...');
});

afterAll(() => {
  // Cleanup after all tests
  console.log('✅ Backend test suite completed');
});

// Global test configuration
jest.setTimeout(30000); // 30 second timeout for tests

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Jest setup file
global.console = {
  ...console,
  // Suppress console logs during tests unless debugging
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
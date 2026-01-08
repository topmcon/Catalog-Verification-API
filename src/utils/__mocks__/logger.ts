// Mock logger for tests
const logger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  silly: jest.fn(),
};

export const httpLogStream = {
  write: jest.fn(),
};

export default logger;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpLogStream = void 0;
// Mock logger for tests
const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
};
exports.httpLogStream = {
    write: jest.fn(),
};
exports.default = logger;
//# sourceMappingURL=logger.js.map
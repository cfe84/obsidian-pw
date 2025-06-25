/// <reference types="jest" />

// Test setup file
// This file runs before each test file

// Mock React DOM for testing components
jest.mock("react-dom/client", () => ({
	createRoot: jest.fn(() => ({
		render: jest.fn(),
		unmount: jest.fn(),
	})),
}));

// Global test utilities
global.console = {
	...console,
	// Uncomment to silence console logs during tests
	// log: jest.fn(),
	// debug: jest.fn(),
	// info: jest.fn(),
	// warn: jest.fn(),
	// error: jest.fn(),
};

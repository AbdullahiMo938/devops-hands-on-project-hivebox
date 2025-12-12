import { jest } from '@jest/globals';

// This exports a fake function whenever 'node-fetch' is imported
export default jest.fn();
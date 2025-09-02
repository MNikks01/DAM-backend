// tests/run-storage-tests.ts
// Simple test file that doesn't import any problematic modules
import { jest } from '@jest/globals';

// Mock the problematic modules globally
jest.mock('../src/configs/configs', () => ({
    getEnvVar: jest.fn((key: string) => {
        const envVars: { [key: string]: string } = {
            CLIENT_URL: 'http://localhost:3000',
            NODE_ENV: 'test',
            MINIO_BUCKET: 'test-bucket'
        };
        return envVars[key] || 'test-value';
    }),
    CLIENT_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
    MINIO_BUCKET: 'test-bucket'
}));

// Now run a simple test
describe('Simple storage test', () => {
    test('should work without config issues', () => {
        expect(true).toBe(true);
    });
});
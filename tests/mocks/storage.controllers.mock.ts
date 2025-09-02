// tests/mocks/storage.controllers.mock.ts
export const mockGeneratePresignedUrl = jest.fn();
export const mockConfirmUpload = jest.fn();
export const mockDownloadAsset = jest.fn();

// Mock the entire module
jest.mock('../../../src/controllers/storage.controllers', () => ({
    generatePresignedUrl: mockGeneratePresignedUrl,
    confirmUpload: mockConfirmUpload,
    downloadAsset: mockDownloadAsset,
}));
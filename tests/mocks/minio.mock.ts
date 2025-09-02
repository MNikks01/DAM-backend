export const BUCKET = "test-bucket";

export default {
    presignedPutObject: jest.fn().mockResolvedValue("https://presigned-put-url.com"),
    presignedGetObject: jest.fn().mockResolvedValue("https://presigned-get-url.com"),
    bucketExists: jest.fn().mockResolvedValue(true),
    makeBucket: jest.fn().mockResolvedValue(undefined),
    setBucketPolicy: jest.fn().mockResolvedValue(undefined),
};
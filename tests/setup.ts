// tests/setup.ts
process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.MONGODB_URI = 'mongodb://localhost:27017/dam-test';
process.env.JWT_ACCESS_SECRET_KEY = 'test-access-secret';
process.env.JWT_REFRESH_SECRET_KEY = 'test-refresh-secret';
process.env.REDIS_PASSWORD = 'test-redis-password';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_PORT = '9000';
process.env.MINIO_USE_SSL = 'false';
process.env.MINIO_ACCESS_KEY = 'minioadmin';
process.env.MINIO_SECRET_KEY = 'minioadmin';
process.env.MINIO_BUCKET = 'test-bucket';

// Mock Redis
jest.mock('../src/configs/redis', () => {
  return {
    __esModule: true,
    default: {
      on: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn(),
    },
  };
});

// Mock MinIO client - export the mock functions
export const mockPresignedPutObject = jest.fn();
export const mockPresignedGetObject = jest.fn();

jest.mock('../src/configs/minio', () => ({
  __esModule: true,
  default: {
    presignedPutObject: mockPresignedPutObject,
    presignedGetObject: mockPresignedGetObject,
  },
}));

// Mock BullMQ queue
jest.mock('../src/queue/queue', () => ({
  __esModule: true,
  enqueueProcessingJob: jest.fn(),
}));

// Mock JWT authentication
jest.mock('../src/utils/jwt', () => ({
  __esModule: true,
  authenticateJWT: jest.fn((req: any, res: any, next: any) => {
    req.user = {
      userId: 'test-user-id',
      email: 'test@example.com',
      team: 'test-team',
      role: 'user'
    };
    next();
  })
}));

// Mock Mongoose models
jest.mock('../src/models/asset.model', () => {
  return {
    __esModule: true,
    default: {
      create: jest.fn(),
      findById: jest.fn(),
      // Add other methods you use
    },
  };
});
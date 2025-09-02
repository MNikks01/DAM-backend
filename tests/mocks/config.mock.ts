// tests/mocks/configs.mock.ts
export const getEnvVar = (key: string): string => {
    const envVars: { [key: string]: string } = {
        CLIENT_URL: 'http://localhost:3000',
        NODE_ENV: 'test',
        PORT: '5000',
        MONGODB_URI: 'mongodb://localhost:27017/test',
        JWT_ACCESS_SECRET_KEY: 'test-access-secret',
        JWT_REFRESH_SECRET_KEY: 'test-refresh-secret',
        REDIS_PASSWORD: 'test-redis-password',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        MINIO_ENDPOINT: 'localhost',
        MINIO_PORT: '9000',
        MINIO_USE_SSL: 'false',
        MINIO_ACCESS_KEY: 'test-access-key',
        MINIO_SECRET_KEY: 'test-secret-key',
        MINIO_BUCKET: 'test-bucket'
    };

    const value = envVars[key];
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
};

export const CLIENT_URL = getEnvVar('CLIENT_URL');
export const NODE_ENV = getEnvVar('NODE_ENV');
export const PORT = Number(getEnvVar('PORT'));
export const MONGODB_URI = getEnvVar('MONGODB_URI');
export const JWT_ACCESS_SECRET_KEY = getEnvVar('JWT_ACCESS_SECRET_KEY');
export const JWT_ACCESS_EXPIRES_IN = '5m';
export const JWT_REFRESH_SECRET_KEY = getEnvVar('JWT_REFRESH_SECRET_KEY');
export const JWT_REFRESH_EXPIRES_IN = '7d';
export const REDIS_PASSWORD = getEnvVar('REDIS_PASSWORD');
export const REDIS_HOST = getEnvVar('REDIS_HOST');
export const REDIS_PORT = getEnvVar('REDIS_PORT');
export const MINIO_ENDPOINT = getEnvVar('MINIO_ENDPOINT');
export const MINIO_PORT = getEnvVar('MINIO_PORT');
export const MINIO_USE_SSL = getEnvVar('MINIO_USE_SSL');
export const MINIO_ACCESS_KEY = getEnvVar('MINIO_ACCESS_KEY');
export const MINIO_SECRET_KEY = getEnvVar('MINIO_SECRET_KEY');
export const MINIO_BUCKET = getEnvVar('MINIO_BUCKET');
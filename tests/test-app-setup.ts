// Load test environment variables first
import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '.env.test') });

// Mock config to avoid environment variable issues
jest.mock('../src/configs/configs', () => ({
    getEnvVar: (key: string) => {
        const envVars: { [key: string]: string } = {
            CLIENT_URL: 'http://localhost:3000',
            JWT_SECRET: 'test-jwt-secret',
            JWT_REFRESH_SECRET: 'test-refresh-secret',
            ACCESS_TOKEN_EXPIRES_IN: '15m',
            REFRESH_TOKEN_EXPIRES_IN: '7d',
            NODE_ENV: 'test',
        };
        return envVars[key] || 'test-value';
    },
    JWT_ACCESS_SECRET_KEY: 'test-access-secret',
    JWT_REFRESH_SECRET_KEY: 'test-refresh-secret',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    NODE_ENV: 'test',
}));

// Now create the app
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);

// Import your actual routes
import authRoutes from '../src/routes/auth.routes.js';
app.use('/api/v1/users', authRoutes);

// Error handling middleware (make sure this is included)
import { globalErrorHandler } from '../src/utils/errorHandler';
app.use(globalErrorHandler);

export default app;
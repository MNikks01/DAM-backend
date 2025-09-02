// Mock everything first - SINGLE VERSION OF EACH MOCK
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
    sign: jest.fn().mockImplementation((payload, secret) => {
        return `mock-token-${payload.userId}`;
    }),
}));

jest.mock("../../src/models/auth.model", () => {
    const mockSave = jest.fn().mockImplementation(function (this: any) {
        if (!this._id) {
            this._id = 'mock-user-id-123';
        }
        return Promise.resolve(this);
    });

    const mockFindOne = jest.fn();
    const mockFindById = jest.fn();
    const mockUpdateOne = jest.fn();

    const MockUser = function (this: any, data: any) {
        this._id = data?._id || 'mock-user-id-123';
        this.email = data?.email;
        this.password = data?.password;
        this.name = data?.name;
        this.team = data?.team;
        this.role = data?.role || 'user';
        this.refreshToken = data?.refreshToken;
        this.save = mockSave;
        this.toObject = () => {
            const obj = { ...this };
            delete obj.password;
            delete obj.save;
            return obj;
        };
        this.comparePassword = jest.fn().mockResolvedValue(true);
    };

    MockUser.findOne = mockFindOne;
    MockUser.findById = mockFindById;
    MockUser.updateOne = mockUpdateOne;

    return MockUser;
});

jest.mock("bcryptjs", () => ({
    compare: jest.fn().mockResolvedValue(true),
    hash: jest.fn().mockResolvedValue("hashedPassword"),
}));

jest.mock("../../src/utils/jwt", () => ({
    generateToken: jest.fn().mockReturnValue("mockToken"),
}));

jest.mock("../../src/configs/configs", () => ({
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

// Now import
import request from "supertest";
import testApp from "../test-app-setup";
import User from "../../src/models/auth.model";
import bcrypt from "bcryptjs";
import { generateToken } from "../../src/utils/jwt";
import jwt from 'jsonwebtoken'; // Import jwt for spyOn

const mockedUser = User as jest.Mocked<typeof User> & {
    findOne: jest.Mock;
    findById: jest.Mock;
    updateOne: jest.Mock;
};

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedGenerateToken = generateToken as jest.Mock;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe("Auth Controller - Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // KEEP YOUR ORIGINAL 3 WORKING TESTS
    it("should register a new user successfully", async () => {
        mockedUser.findOne.mockResolvedValue(null);
        mockedBcrypt.hash.mockResolvedValue("hashedPassword" as never);

        const response = await request(testApp)
            .post("/api/v1/users/register")
            .send({
                email: "test@example.com",
                password: "123456",
                confirmPassword: "123456",
                name: "Test User",
                team: "Team A",
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(mockedUser.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
    });

    it("should return error when email already exists", async () => {
        mockedUser.findOne.mockResolvedValue({
            email: "test@example.com",
            name: "Existing User",
            team: "Team A",
        });

        const response = await request(testApp)
            .post("/api/v1/users/register")
            .send({
                email: "test@example.com",
                password: "123456",
                confirmPassword: "123456",
                name: "Test User",
                team: "Team A",
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toContain("Email already in use");
    });

    it("should login user successfully", async () => {
        mockedUser.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                _id: "user123",
                email: "test@example.com",
                password: "hashedPassword",
                name: "Test User",
                team: "Team A",
                role: "user",
                comparePassword: jest.fn().mockResolvedValue(true),
                save: jest.fn().mockResolvedValue(true),
                toObject: () => ({
                    _id: "user123",
                    email: "test@example.com",
                    name: "Test User",
                    team: "Team A",
                    role: "user",
                }),
            }),
        });

        mockedBcrypt.compare.mockResolvedValue(true as never);

        const response = await request(testApp)
            .post("/api/v1/users/login")
            .send({
                email: "test@example.com",
                password: "123456",
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Login successful");
    });
})
// ADD THE NEW TESTS
describe("Registration Edge Cases", () => {
    it("should return 400 if required fields are missing", async () => {
        const response = await request(testApp)
            .post("/api/v1/users/register")
            .send({
                email: "test@example.com",
                // missing password, confirmPassword, name, team
            });

        expect(response.status).toBe(400);
        // Zod validation catches this first
        expect(response.body.message).toContain("Validation error");
        expect(response.body.message).toContain("password: Invalid input");
        expect(response.body.message).toContain("name: Invalid input");
    });

    it("should handle database errors during registration", async () => {
        mockedUser.findOne.mockRejectedValue(new Error("Database connection failed"));

        const response = await request(testApp)
            .post("/api/v1/users/register")
            .send({
                email: "test@example.com",
                password: "123456",
                confirmPassword: "123456",
                name: "Test User",
                team: "Team A",
            });

        expect(response.status).toBe(500);
    });
});

describe("Login Edge Cases", () => {
    it("should return 401 if user is not found", async () => {
        mockedUser.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
        });

        const response = await request(testApp)
            .post("/api/v1/users/login")
            .send({
                email: "nonexistent@example.com",
                password: "123456",
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Invalid email or password.");
    });

    it("should return 401 if password is incorrect", async () => {
        // Mock user found with password
        const mockUser = {
            _id: "user123",
            email: "test@example.com",
            password: "hashedPassword",
            name: "Test User",
            team: "Team A",
            role: "user",
            save: jest.fn().mockResolvedValue(true),
            toObject: () => ({
                _id: "user123",
                email: "test@example.com",
                name: "Test User",
                team: "Team A",
                role: "user",
            }),
        };

        mockedUser.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUser),
        });

        // Mock bcrypt.compare to return false (incorrect password)
        mockedBcrypt.compare.mockResolvedValue(false as never);

        const response = await request(testApp)
            .post("/api/v1/users/login")
            .send({
                email: "test@example.com",
                password: "wrongpassword",
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Invalid email or password.");
    });

    it("should return 401 if user has no role", async () => {
        // Mock user found with password but no role
        const mockUser = {
            _id: "user123",
            email: "test@example.com",
            password: "hashedPassword",
            name: "Test User",
            team: "Team A",
            // no role defined
            save: jest.fn().mockResolvedValue(true),
            toObject: () => ({
                _id: "user123",
                email: "test@example.com",
                name: "Test User",
                team: "Team A",
                // no role in toObject either
            }),
        };

        mockedUser.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUser),
        });

        // Mock bcrypt.compare to return true (password is correct)
        mockedBcrypt.compare.mockResolvedValue(true as never);

        const response = await request(testApp)
            .post("/api/v1/users/login")
            .send({
                email: "test@example.com",
                password: "123456", // correct password
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Invalid Request. Please login again");
    });
});

describe("Login Edge Cases", () => {
    it("should return 401 if user is not found", async () => {
        mockedUser.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
        });

        const response = await request(testApp)
            .post("/api/v1/users/login")
            .send({
                email: "nonexistent@example.com",
                password: "123456",
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Invalid email or password.");
    });

    it("should return 401 if password is incorrect", async () => {
        // Mock user found with password
        const mockUser = {
            _id: "user123",
            email: "test@example.com",
            password: "hashedPassword",
            name: "Test User",
            team: "Team A",
            role: "user",
            save: jest.fn().mockResolvedValue(true),
            toObject: () => ({
                _id: "user123",
                email: "test@example.com",
                name: "Test User",
                team: "Team A",
                role: "user",
            }),
        };

        mockedUser.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(mockUser),
        });

        // Mock bcrypt.compare to return false (incorrect password)
        mockedBcrypt.compare.mockResolvedValue(false as never);

        const response = await request(testApp)
            .post("/api/v1/users/login")
            .send({
                email: "test@example.com",
                password: "wrongpassword",
            });

        console.log('Response status:', response.status);
        console.log('Response body:', JSON.stringify(response.body, null, 2));
        console.log('bcrypt.compare calls:', mockedBcrypt.compare.mock.calls);

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Invalid email or password.");
    });

    describe("Logout", () => {
        it("should logout user successfully with refresh token", async () => {
            const mockUser = {
                refreshToken: "valid-refresh-token",
                save: jest.fn().mockResolvedValue(true),
            };

            mockedUser.findOne.mockResolvedValue(mockUser);
            mockedUser.updateOne.mockResolvedValue({});

            const response = await request(testApp)
                .post("/api/v1/users/logout")
                .set('Cookie', ['refreshToken=valid-refresh-token']);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Logged out successfully");
        });

        it("should logout user successfully without refresh token", async () => {
            mockedUser.findOne.mockResolvedValue(null);

            const response = await request(testApp)
                .post("/api/v1/users/logout")
                .set('Cookie', []);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Logged out successfully");
        });
    });

    describe("Refresh Token", () => {
        it("should return 401 if refresh token is missing", async () => {
            const response = await request(testApp)
                .post("/api/v1/users/refresh-token")
                .set('Cookie', []);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Refresh token missing");
        });

        it("should return 403 if refresh token is invalid", async () => {
            mockedJwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const response = await request(testApp)
                .post("/api/v1/users/refresh-token")
                .set('Cookie', ['refreshToken=invalid-token']);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Invalid or expired refresh token");
        });

        it("should return 403 if refresh token mismatch", async () => {
            mockedJwt.verify.mockReturnValue({ userId: "user123" } as any);

            mockedUser.findById.mockResolvedValue({
                _id: "user123",
                refreshToken: "different-token",
            });

            const response = await request(testApp)
                .post("/api/v1/users/refresh-token")
                .set('Cookie', ['refreshToken=wrong-token']);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe("Refresh token mismatch");
        });

        it("should refresh token successfully", async () => {
            mockedJwt.verify.mockReturnValue({ userId: "user123" } as any);

            const mockUser = {
                _id: "user123",
                refreshToken: "valid-token",
                team: "Team A",
                role: "user",
                save: jest.fn().mockResolvedValue(true),
            };

            mockedUser.findById.mockResolvedValue(mockUser);

            const response = await request(testApp)
                .post("/api/v1/users/refresh-token")
                .set('Cookie', ['refreshToken=valid-token']);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Token refreshed successfully");
            expect(response.body.token).toBeDefined();
        });
    });

    describe("Token Generation Edge Cases", () => {
        it("should return 401 if access token generation fails during registration", async () => {
            mockedUser.findOne.mockResolvedValue(null);
            mockedBcrypt.hash.mockResolvedValue("hashedPassword" as never);

            mockedGenerateToken.mockImplementation((payload, secret, expiresIn) => {
                if (secret === 'test-access-secret') return undefined;
                return 'mock-refresh-token';
            });

            const response = await request(testApp)
                .post("/api/v1/users/register")
                .send({
                    email: "test@example.com",
                    password: "123456",
                    confirmPassword: "123456",
                    name: "Test User",
                    team: "Team A",
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Missing authentication tokens.");
        });
    });
});
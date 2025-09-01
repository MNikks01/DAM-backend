// Mock dependencies FIRST
jest.mock("../../src/models/auth.model", () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const mockFindOne = jest.fn();
  const mockFindById = jest.fn();

  const MockUser = function (data: any) {
    return {
      ...data,
      save: mockSave,
      toObject: () => data
    };
  };

  MockUser.findOne = mockFindOne;
  MockUser.findById = mockFindById;
  MockUser.updateOne = jest.fn();

  return MockUser;
});

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

jest.mock("../../src/utils/jwt", () => ({
  generateToken: jest.fn(),
}));

// Now import everything
import request from "supertest";
import app from "../../src/app";
import User from "../../src/models/auth.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../../src/utils/jwt";

// Type the mocks
const mockedUser = User as jest.Mocked<typeof User> & {
  findOne: jest.Mock;
  findById: jest.Mock;
  updateOne: jest.Mock;
};

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedGenerateToken = generateToken as jest.Mock;

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should register user and return tokens", async () => {
      // Mock user not found
      mockedUser.findOne.mockResolvedValue(null);

      // Mock bcrypt hash
      mockedBcrypt.hash.mockResolvedValue("hashedPassword" as never);

      // Mock token generation
      mockedGenerateToken.mockReturnValue("mockToken");

      const res = await request(app)
        .post("/api/v1/users/register")
        .send({
          email: "test@example.com",
          password: "123456",
          confirmPassword: "123456",
          name: "Test User",
          team: "Team A",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockedUser.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
    });

    it("should return 409 if email already exists", async () => {
      // Mock existing user
      mockedUser.findOne.mockResolvedValue({
        _id: "existing123",
        email: "test@example.com",
        name: "Existing User",
        team: "Team A"
      });

      const res = await request(app)
        .post("/api/v1/users/register")
        .send({
          email: "test@example.com",
          password: "123456",
          confirmPassword: "123456",
          name: "Test User",
          team: "Team A",
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe("Email already in use.");
    });
  });

  describe("loginUser", () => {
    it("should login successfully", async () => {
      const mockUser = {
        _id: "user123",
        email: "test@example.com",
        password: "hashedPassword",
        name: "Test User",
        team: "Team A",
        role: "user",
        refreshToken: "oldRefreshToken",
        save: jest.fn().mockResolvedValue(true),
      };

      // Mock user found
      mockedUser.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      // Mock password comparison
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Mock token generation
      mockedGenerateToken.mockReturnValue("newToken");

      const res = await request(app)
        .post("/api/v1/users/login")
        .send({
          email: "test@example.com",
          password: "123456",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Login successful");
    });
  });
});
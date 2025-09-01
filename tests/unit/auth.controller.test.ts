// import request from "supertest";
// import app from "../../src/app"; // Express app
// import User from "../../src/models/auth.model";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { generateToken } from "../../src/utils/jwt";
// import { AppError } from "../../src/utils/errorHandler";
// import { jest } from "@jest/globals";

// // Mock dependencies
// jest.mock("../../src/models/auth.model");
// jest.mock("bcryptjs");
// jest.mock("jsonwebtoken");
// jest.mock("../../src/utils/jwt");

// // Setup mock user
// const mockUser = {
//   _id: "user123",
//   name: "Test User",
//   email: "test@example.com",
//   password: "hashedPassword",
//   team: "Team A",
//   role: "user",
//   refreshToken: "mockRefreshToken",
//   save: jest.fn().mockResolvedValue(true),

//   toObject: () => ({
//     _id: "user123",
//     name: "Test User",
//     email: "test@example.com",
//     team: "Team A",
//     role: "user",
//   }),
// };

// describe("Auth Controller", () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });
//   jest.mock("../../src/models/auth.model", () => {
//     const actual = jest.requireActual("../../src/models/auth.model");
//     return {
//       __esModule: true,
//       default: {
//         ...actual,
//         findOne: jest.fn(),
//         findById: jest.fn(),
//         updateOne: jest.fn(),
//       },
//     };
//   });

//   describe("registerUser", () => {
//     it("should return 400 if required fields are missing", async () => {
//       const res = await request(app).post("/api/v1/users/register").send({}); // Missing all fields
//       expect(res.status).toBe(400);
//       expect(res.body.message).toBe("Missing required fields");
//     });

//     it("should return 400 if passwords do not match", async () => {
//       const res = await request(app).post("/api/v1/users/register").send({
//         email: "test@example.com",
//         password: "123456",
//         confirmPassword: "wrongpassword",
//         name: "Test",
//         team: "Team A",
//       });
//       expect(res.status).toBe(400);
//       expect(res.body.message).toBe("Password not matching");
//     });

//     it("should return 409 if email already exists", async () => {
//       (User as any).mockResolvedValue(mockUser);
//       const res = await request(app).post("/api/v1/users/register").send({
//         email: "test@example.com",
//         password: "123456",
//         confirmPassword: "123456",
//         name: "Test",
//         team: "Team A",
//       });
//       expect(res.status).toBe(409);
//       expect(res.body.message).toBe("Email already in use.");
//     });

//     it("should register user and return tokens", async () => {
//       (User.findOne as jest.Mock).mockResolvedValue(null);
//       (generateToken as jest.Mock).mockReturnValue("mockToken");
//       (User as any).mockImplementation(() => mockUser);

//       const res = await request(app).post("/api/v1/users/register").send({
//         email: "test@example.com",
//         password: "123456",
//         confirmPassword: "123456",
//         name: "Test",
//         team: "Team A",
//       });

//       expect(res.status).toBe(201);
//       expect(res.body.success).toBe(true);
//       expect(res.body.data.email).toBe("test@example.com");
//       expect(res.headers["set-cookie"]).toBeDefined();
//     });
//   });
// });

// ✅ MOCK FIRST — BEFORE imports
jest.mock("../../src/models/auth.model", () => {
  const mockUserConstructor = jest.fn();

  mockUserConstructor.findOne = jest.fn();
  mockUserConstructor.findById = jest.fn();
  mockUserConstructor.updateOne = jest.fn();

  return {
    __esModule: true,
    default: mockUserConstructor,
  };
});

jest.mock("../../src/utils/jwt", () => ({
  __esModule: true,
  generateToken: jest.fn(),
}));

import request from "supertest";
import app from "../../src/app";
import User from "../../src/models/auth.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../../src/utils/jwt";
import { jest } from "@jest/globals";

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  sign: jest.fn(),
  verify: jest.fn(),
}));
jest.mock("../../src/utils/jwt", () => ({
  __esModule: true,
  generateToken: jest.fn(),
}));

// ✅ mock user object
const mockUser = {
  _id: "user123",
  name: "Test User",
  email: "test@example.com",
  password: "hashedPassword",
  team: "Team A",
  role: "user",
  refreshToken: "mockRefreshToken",
  save: jest.fn().mockResolvedValue(true),
  toObject: () => ({
    _id: "user123",
    name: "Test User",
    email: "test@example.com",
    team: "Team A",
    role: "user",
  }),
};

// import User from "../../src/models/auth.model";

// const mockedUser = User as jest.Mock & {
//   findOne: jest.Mock;
//   findById: jest.Mock;
//   updateOne: jest.Mock;
// };
// const mockedUser = User as jest.Mocked<typeof User>;

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    // it("should return 400 if required fields are missing", async () => {
    //   const res = await request(app).post("/api/v1/users/register").send({});
    //   expect(res.status).toBe(400);
    //   expect(res.body.message).toContain("Validation error:");
    //   expect(res.body.message).toContain("email: Invalid input");
    // });

    // it("should return 400 if passwords do not match", async () => {
    //   const res = await request(app).post("/api/v1/users/register").send({
    //     email: "test@example.com",
    //     password: "123456",
    //     confirmPassword: "wrongpassword",
    //     name: "Test",
    //     team: "Team A",
    //   });
    //   expect(res.status).toBe(400);
    //   expect(res.body.message).toBe(
    //     "Validation error: confirmPassword: Passwords do not match"
    //   );
    // });

    // it("should return 409 if email already exists", async () => {
    //   // issues here
    //   mockedUser.findOne.mockResolvedValue(mockUser);

    //   const res = await request(app).post("/api/v1/users/register").send({
    //     email: "test@example.com",
    //     password: "123456",
    //     confirmPassword: "123456",
    //     name: "Test",
    //     team: "Team A",
    //   });

    //   expect(res.status).toBe(409);
    //   expect(res.body.message).toBe("Email already in use.");
    // });

    it("should register user and return tokens", async () => {
      const mockedUser = User as jest.Mocked<typeof User>;

      mockedUser.findOne.mockResolvedValue(null);
      mockedUser.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({
          _id: "user123",
          name: "Test User",
          email: "test@example.com",
          team: "Team A",
          role: "user",
        }),
      }));

      console.log("User.findOne:", User.findOne);
      console.log("Is mock fn?", jest.isMockFunction(User.findOne));

      const res = await request(app).post("/api/v1/users/register").send({
        email: "test@example.com",
        password: "123456",
        confirmPassword: "123456",
        name: "Test",
        team: "Team A",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("test@example.com");
      expect(res.headers["set-cookie"]).toBeDefined();
    });
  });

  //   describe("loginUser", () => {
  //     it("should return 401 if user not found", async () => {
  //       (User.findOne as jest.Mock).mockReturnValue({
  //         select: jest.fn().mockResolvedValue(null),
  //       });

  //       const res = await request(app).post("/api/v1/users/login").send({
  //         email: "test@example.com",
  //         password: "123456",
  //       });

  //       expect(res.status).toBe(401);
  //       expect(res.body.message).toBe("Invalid email or password.");
  //     });

  //     it("should return 401 if password does not match", async () => {
  //       (User.findOne as jest.Mock).mockReturnValue({
  //         select: jest.fn().mockResolvedValue(mockUser),
  //       });
  //       (bcrypt.compare as jest.Mock).mockResolvedValue(false);

  //       const res = await request(app).post("/api/v1/users/login").send({
  //         email: "test@example.com",
  //         password: "wrongpass",
  //       });

  //       expect(res.status).toBe(401);
  //       expect(res.body.message).toBe("Invalid email or password.");
  //     });

  //     it("should login and return tokens", async () => {
  //       (User.findOne as jest.Mock).mockReturnValue({
  //         select: jest.fn().mockResolvedValue(mockUser),
  //       });
  //       (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  //       (generateToken as jest.Mock).mockReturnValue("mockToken");

  //       const res = await request(app).post("/api/v1/users/login").send({
  //         email: "test@example.com",
  //         password: "123456",
  //       });

  //       expect(res.status).toBe(200);
  //       expect(res.body.message).toBe("Login successful");
  //       expect(res.body.data.email).toBe("test@example.com");
  //       expect(res.headers["set-cookie"]).toBeDefined();
  //     });
  //   });

  //   describe("logoutUser", () => {
  //     it("should clear cookies and logout successfully", async () => {
  //       (User.findOne as jest.Mock).mockResolvedValue(mockUser);
  //       (User.updateOne as jest.Mock).mockResolvedValue({});

  //       const res = await request(app)
  //         .post("/api/v1/users/logout")
  //         .set("Cookie", ["refreshToken=mockRefreshToken"]);

  //       expect(res.status).toBe(200);
  //       expect(res.body.message).toBe("Logged out successfully");
  //     });
  //   });

  //   describe("refreshTokenHandler", () => {
  //     it("should return 401 if refresh token is missing", async () => {
  //       const res = await request(app).post("/api/v1/users/refresh-token");

  //       expect(res.status).toBe(401);
  //       expect(res.body.message).toBe("Refresh token missing");
  //     });

  //     it("should return 403 if token is invalid", async () => {
  //       (jwt.verify as jest.Mock).mockImplementation(() => {
  //         throw new Error("Invalid token");
  //       });

  //       const res = await request(app)
  //         .post("/api/v1/users/refresh-token")
  //         .set("Cookie", ["refreshToken=invalid"]);

  //       expect(res.status).toBe(403);
  //       expect(res.body.message).toBe("Invalid or expired refresh token");
  //     });

  //     it("should return 403 if refresh token mismatch", async () => {
  //       (jwt.verify as jest.Mock).mockReturnValue({ userId: "user123" });
  //       (User.findById as jest.Mock).mockResolvedValue({
  //         ...mockUser,
  //         refreshToken: "differentToken",
  //       });

  //       const res = await request(app)
  //         .post("/api/v1/users/refresh-token")
  //         .set("Cookie", ["refreshToken=wrongToken"]);

  //       expect(res.status).toBe(403);
  //       expect(res.body.message).toBe("Refresh token mismatch");
  //     });

  //     it("should refresh token successfully", async () => {
  //       (jwt.verify as jest.Mock).mockReturnValue({ userId: "user123" });
  //       (User.findById as jest.Mock).mockResolvedValue(mockUser);
  //       (generateToken as jest.Mock).mockReturnValue("newAccessToken");

  //       const res = await request(app)
  //         .post("/api/v1/users/refresh-token")
  //         .set("Cookie", ["refreshToken=mockRefreshToken"]);

  //       expect(res.status).toBe(200);
  //       expect(res.body.message).toBe("Token refreshed successfully");
  //       expect(res.body.token).toBe("newAccessToken");
  //     });
  //   });
});

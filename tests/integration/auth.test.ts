import request from "supertest";
import app from "../../src/app"; // your express app (make sure to export app from server/app file)
import User from "../../src/models/auth.model";
import bcrypt from "bcryptjs";
import { jest } from "@jest/globals";

// jest.setTimeout(30000); // 30 seconds to prevent all timeouts

describe("Auth routes", () => {
  const apiPrefix = "/api/v1/users";

  describe("POST /register", () => {
    it("should register a new user", async () => {
      const res = await request(app).post(`${apiPrefix}/register`).send({
        email: "test@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
        name: "Test User",
        team: "TeamA",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("test@example.com");

      const user = await User.findOne({ email: "test@example.com" });
      expect(user).not.toBeNull();
    });

    // it("should not register user with existing email", async () => {
    //   await User.create({
    //     email: "duplicate@example.com",
    //     password: "hashedPassword",
    //     confirmPassword: "hashedPassword",
    //     name: "Duplicate User",
    //     team: "TeamA",
    //   });

    //   const res = await request(app).post(`${apiPrefix}/register`).send({
    //     email: "duplicate@example.com",
    //     password: "Password123!",
    //     confirmPassword: "Password123!",
    //     name: "Duplicate User",
    //     team: "TeamA",
    //   });

    //   console.log("Register response:", res.body);

    //   expect(res.statusCode).toBe(409);
    //   expect(res.body.message).toMatch(/email already in use/i);
    // });
  });

  // describe("POST /login", () => {
  //   beforeEach(async () => {
  //     // Create user with hashed password
  //     const hashedPassword = await bcrypt.hash("Password123!", 10);

  //     const user = await User.create({
  //       email: "loginuser@example.com",
  //       password: hashedPassword,
  //       name: "Login User",
  //       team: "TeamB",
  //       role: "user",
  //     });
  //     console.log("Created user:", user.email);
  //   });

  //   it("should login user with correct credentials", async () => {
  //     const res = await request(app).post(`${apiPrefix}/login`).send({
  //       email: "loginuser@example.com",
  //       password: "Password123!",
  //     });

  //     expect(res.statusCode).toBe(200);
  //     expect(res.body.success).toBe(true);
  //     expect(res.body.data.email).toBe("loginuser@example.com");
  //     expect(res.headers["set-cookie"]).toBeDefined(); // cookies are set
  //   });

  //   it("should fail login with wrong password", async () => {
  //     const res = await request(app).post(`${apiPrefix}/login`).send({
  //       email: "loginuser@example.com",
  //       password: "WrongPassword!",
  //     });

  //     expect(res.statusCode).toBe(401);
  //     expect(res.body.message).toMatch(/invalid email or password/i);
  //   });

  //   it("should fail login with unknown email", async () => {
  //     const res = await request(app).post(`${apiPrefix}/login`).send({
  //       email: "unknown@example.com",
  //       password: "Password123!",
  //     });

  //     expect(res.statusCode).toBe(401);
  //     expect(res.body.message).toMatch(/invalid email or password/i);
  //   });
  // });

  // describe("POST /logout", () => {
  //   it("should logout user by clearing cookies", async () => {
  //     const res = await request(app).post(`${apiPrefix}/logout`);

  //     expect(res.statusCode).toBe(200);
  //     expect(res.body.success).toBe(true);
  //     expect(res.body.message).toMatch(/logged out successfully/i);
  //     expect(res.headers["set-cookie"]).toBeDefined();
  //   });
  // });

  // describe("POST /refresh-token", () => {
  //   it("should return 401 if no refresh token cookie", async () => {
  //     const refreshCookie = `ckjsakcascnalkcsalnlsancasjckslcsdhbcsdbcsocsb;ic`;
  //     const res = await request(app)
  //       .post(`${apiPrefix}/refresh-token`)
  //       .set("Cookie", [refreshCookie]);

  //     expect(res.statusCode).toBe(401);
  //     expect(res.body.message).toMatch(/refresh token missing/i);
  //   });

  //   // To test with valid refresh token, you'd need to:
  //   // 1) register or login user
  //   // 2) extract refresh token cookie
  //   // 3) send cookie with request
  //   // This can be a more complex flow if you want I can help with it.
  // });
});

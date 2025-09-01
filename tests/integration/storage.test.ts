import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app";
import Asset from "../../src/models/asset.model";
import { generateToken } from "../../src/utils/jwt";
import { JWT_ACCESS_SECRET_KEY } from "../../src/configs/configs";
import { jest } from "@jest/globals";

// 👤 Dummy user payload
const userPayload = {
  userId: new mongoose.Types.ObjectId().toString(),
  role: "user",
  team: "frontend",
};

jest.unstable_mockModule("../../src/configs/minio", () => ({
  __esModule: true,
  default: {
    presignedPutObject: jest.fn().mockResolvedValue("http://minio/upload-url"),
    presignedGetObject: jest
      .fn()
      .mockResolvedValue("http://minio/download-url"),
  },
  BUCKET: "assets",
}));

afterEach(async () => {
  await Asset.deleteMany({});
});

const token = generateToken(userPayload, JWT_ACCESS_SECRET_KEY, "5m");

const authCookie = `token=${token}`;

describe("Storage Routes", () => {
  beforeAll(async () => {
    // optional: connect to in-memory MongoDB if not globally setup
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("POST /api/v1/storage/presign", () => {
    it("should return a presigned upload URL", async () => {
      const response = await request(app)
        .post("/api/v1/storage/presign")
        .set("Cookie", authCookie)
        .send({ fileName: "test.jpg" });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("url");
      expect(response.body).toHaveProperty("key");
    });
    it("should fail if fileName is missing", async () => {
      const response = await request(app)
        .post("/api/v1/storage/presign")
        .set("Cookie", authCookie)
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Filename is required");
    });
  });

  // describe("POST /api/v1/storage/confirm", () => {
  //   it("should create an asset record and queue processing job", async () => {
  //     const key = "uploads/2025/09/some-file.jpg";
  //     // key, fileName, originalName, mimeType, size, tags, category, path;
  //     const body = {
  //       key,
  //       fileName: "some-file.jpg",
  //       originalName: "original.jpg",
  //       mimeType: "image/jpeg",
  //       size: "123456", // ✅ String instead of number
  //       tags: ["tag1", "tag2"],
  //       category: "image", // ✅ valid enum value
  //     };

  //     const response = await request(app)
  //       .post("/api/v1/storage/confirm")
  //       .set("Cookie", authCookie)
  //       .send(body);

  //     expect(response.status).toBe(201);
  //     expect(response.body).toHaveProperty("message");
  //     expect(response.body).toHaveProperty("assetId");
  //     expect(response.body.status).toBe("pending");

  //     // Optional: Check DB
  //     const assetInDb = await Asset.findById(response.body.assetId);
  //     expect(assetInDb?.status).toBe("pending");
  //     expect(assetInDb).not.toBeNull();
  //     expect(assetInDb?.fileName).toBe("some-file.jpg");
  //   });

  //   it("should return 400 for missing required fields", async () => {
  //     const response = await request(app)
  //       .post("/api/v1/storage/confirm")
  //       .set("Cookie", authCookie)
  //       .send({});

  //     expect(response.status).toBe(400);
  //     expect(response.body.message).toBe("Missing required fields");
  //   });
  //   it("should return 401 if unauthorized", async () => {
  //     const response = await request(app)
  //       .post("/api/v1/storage/confirm")
  //       .send({}); // no auth cookie

  //     expect(response.status).toBe(401);
  //     expect(response.body.message).toBe("Unauthorized");
  //   });
  // });

  // describe("GET /api/v1/storage/:id/download", () => {
  //   it("should return a presigned download URL", async () => {
  //     // First, insert a dummy asset
  //     const asset = await Asset.create({
  //       key: "uploads/2025/09/test.jpg",
  //       fileName: "test.jpg",
  //       originalName: "test.jpg",
  //       mimeType: "image/jpeg",
  //       size: "100",
  //       tags: [],
  //       category: "image",
  //       uploader: new mongoose.Types.ObjectId(userPayload.userId), // cast to ObjectId
  //       team: userPayload.team,
  //       bucket: process.env.MINIO_BUCKET_NAME || "assets",
  //       path: "uploads/2025/09/test.jpg",
  //       downloadCount: 0,
  //       status: "processed",
  //       versions: {
  //         original: "uploads/2025/09/test.jpg",
  //         compressed: "uploads/2025/09/test.jpg",
  //       },
  //       metadata: {},
  //     });

  //     const response = await request(app)
  //       .get(`/api/v1/storage/${asset._id}/download`)
  //       .set("Cookie", authCookie);

  //     expect(response.status).toBe(200);
  //     expect(response.body).toHaveProperty("url");
  //   });

  //   it("should return 404 if asset not found", async () => {
  //     const fakeId = new mongoose.Types.ObjectId().toString();

  //     const response = await request(app)
  //       .get(`/api/v1/storage/${fakeId}/download`)
  //       .set("Cookie", authCookie);

  //     expect(response.status).toBe(404);
  //     expect(response.body.message).toBe("Asset not found");
  //   });
  // });
});

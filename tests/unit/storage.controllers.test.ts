// tests/unit/storage.controllers.test.ts
import { Request, Response, NextFunction } from 'express';
import request from "supertest";
import express from "express";
import { Types } from "mongoose";

// Import the mock functions from setup
import { mockPresignedPutObject, mockPresignedGetObject } from "../setup";

// Mock the modules
jest.mock('../../src/models/asset.model');
jest.mock('../../src/queue/queue');

// Import after mocking
import Asset from "../../src/models/asset.model";
import { enqueueProcessingJob } from "../../src/queue/queue";
import {
    generatePresignedUrl,
    confirmUpload,
    downloadAsset,
} from "../../src/controllers/storage.controllers";

// Mock the authentication middleware directly
jest.mock('../../src/utils/jwt', () => ({
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

// Import the mocked middleware
import { authenticateJWT } from "../../src/utils/jwt";

const app = express();
app.use(express.json());
app.post("/presign", generatePresignedUrl);
app.post("/confirm", confirmUpload);
app.get("/download/:id", downloadAsset);

describe("Storage Controllers", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mock implementations
        mockPresignedPutObject.mockResolvedValue('https://presigned-put-url.com');
        mockPresignedGetObject.mockResolvedValue('https://presigned-get-url.com');
        (enqueueProcessingJob as jest.Mock).mockResolvedValue(undefined);

        // Reset the authentication mock
        (authenticateJWT as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
            req.user = {
                userId: 'test-user-id',
                email: 'test@example.com',
                team: 'test-team',
                role: 'user'
            };
            next();
        });
    });

    describe("generatePresignedUrl", () => {
        it("should generate a presigned URL successfully", async () => {
            const fileName = "test-file.jpg";

            const response = await request(app)
                .post("/presign")
                .send({ fileName });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("url");
            expect(response.body).toHaveProperty("key");
            expect(mockPresignedPutObject).toHaveBeenCalled();
        });

        it("should return 400 if fileName is missing", async () => {
            const response = await request(app)
                .post("/presign")
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("message", "Filename is required");
        });

        it("should handle MinIO errors", async () => {
            mockPresignedPutObject.mockRejectedValueOnce(new Error("MinIO error"));

            const response = await request(app)
                .post("/presign")
                .send({ fileName: "test.jpg" });

            expect(response.status).toBe(500);
        });
    });

    describe("confirmUpload", () => {
        const validPayload = {
            key: "uploads/2024/1/test-uuid.jpg",
            fileName: "test-file.jpg",
            originalName: "test-file-original.jpg",
            mimeType: "image/jpeg",
            size: 1024,
            tags: ["test"],
            category: "image"
        };

        // it("should confirm upload and create asset successfully", async () => {
        //     const mockAsset = {
        //         _id: new Types.ObjectId(),
        //         save: jest.fn().mockResolvedValue(undefined),
        //     };

        //     (Asset.create as jest.Mock).mockResolvedValueOnce(mockAsset);

        //     const response = await request(app)
        //         .post("/confirm")
        //         .send(validPayload);

        //     expect(response.status).toBe(201);
        //     expect(response.body).toHaveProperty("message", "Upload confirmed and processing started");
        //     expect(response.body).toHaveProperty("assetId");
        //     expect(Asset.create).toHaveBeenCalled();
        //     expect(enqueueProcessingJob).toHaveBeenCalled();
        // });

        // it("should return 400 if required fields are missing", async () => {
        //     const invalidPayload = { ...validPayload };
        //     delete invalidPayload.fileName;

        //     const response = await request(app)
        //         .post("/confirm")
        //         .send(invalidPayload);

        //     expect(response.status).toBe(400);
        // });

        // it("should handle database errors", async () => {
        //     (Asset.create as jest.Mock).mockRejectedValueOnce(new Error("Database error"));

        //     const response = await request(app)
        //         .post("/confirm")
        //         .send(validPayload);

        //     expect(response.status).toBe(500);
        // });
    });

    describe("downloadAsset", () => {
        it("should generate download URL successfully", async () => {
            const mockAsset = {
                _id: new Types.ObjectId(),
                key: "test-key",
                bucket: "test-bucket",
                downloadCount: 0,
                save: jest.fn().mockResolvedValue(undefined),
            };

            (Asset.findById as jest.Mock).mockResolvedValueOnce(mockAsset);

            const response = await request(app)
                .get("/download/1234567890abcdef12345678");

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("status", "success");
            expect(response.body).toHaveProperty("url");
            expect(mockPresignedGetObject).toHaveBeenCalled();
            expect(mockAsset.save).toHaveBeenCalled();
        });

        it("should return 404 if asset not found", async () => {
            (Asset.findById as jest.Mock).mockResolvedValueOnce(null);

            const response = await request(app)
                .get("/download/1234567890abcdef12345678");

            expect(response.status).toBe(404);
        });

        it("should handle MinIO errors during download URL generation", async () => {
            const mockAsset = {
                _id: new Types.ObjectId(),
                key: "test-key",
                bucket: "test-bucket",
                downloadCount: 0,
                save: jest.fn().mockResolvedValue(undefined),
            };

            (Asset.findById as jest.Mock).mockResolvedValueOnce(mockAsset);
            mockPresignedGetObject.mockRejectedValueOnce(new Error("MinIO error"));

            const response = await request(app)
                .get("/download/1234567890abcdef12345678");

            expect(response.status).toBe(500);
        });
    });
});
import { authorizeUploaderOrAdmin } from "../../src/middleware/authorizeUploaderOrAdmin";
import Asset from "../../src/models/asset.model";
import { AppError } from "../../src/utils/errorHandler";
import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";

describe("authorizeUploaderOrAdmin", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            params: { id: "507f1f77bcf86cd799439011" },
            user: {
                userId: "507f1f77bcf86cd799439012",
                role: "user",
                team: "test-team"
            }
        };
        mockResponse = {};
        nextFunction = jest.fn();
    });

    it("should call next with AppError if asset not found", async () => {
        (Asset.findById as jest.Mock).mockResolvedValueOnce(null);

        await authorizeUploaderOrAdmin(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
        expect(nextFunction).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "No asset found with that ID",
                statusCode: 404,
            })
        );
    });

    it("should call next with AppError if user not authenticated", async () => {
        mockRequest.user = undefined;
        (Asset.findById as jest.Mock).mockResolvedValueOnce({
            _id: new Types.ObjectId(),
            uploader: "507f1f77bcf86cd799439012",
        });

        await authorizeUploaderOrAdmin(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
        expect(nextFunction).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "Unauthorized",
                statusCode: 401,
            })
        );
    });

    it("should authorize uploader", async () => {
        const mockAsset = {
            _id: new Types.ObjectId(),
            uploader: "507f1f77bcf86cd799439012", // Same as user ID
        };

        (Asset.findById as jest.Mock).mockResolvedValueOnce(mockAsset);

        await authorizeUploaderOrAdmin(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalledWith();
        expect(mockRequest.asset).toEqual(mockAsset);
    });

    it("should authorize admin", async () => {
        mockRequest.user = {
            userId: "507f1f77bcf86cd799439013", // Different from uploader
            role: "admin",
            team: "test-team"
        };

        const mockAsset = {
            _id: new Types.ObjectId(),
            uploader: "507f1f77bcf86cd799439012", // Different from user ID
        };

        (Asset.findById as jest.Mock).mockResolvedValueOnce(mockAsset);

        await authorizeUploaderOrAdmin(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalledWith();
        expect(mockRequest.asset).toEqual(mockAsset);
    });

    it("should reject non-uploader non-admin", async () => {
        mockRequest.user = {
            userId: "507f1f77bcf86cd799439013", // Different from uploader
            role: "user", // Not admin
            team: "test-team"
        };

        const mockAsset = {
            _id: new Types.ObjectId(),
            uploader: "507f1f77bcf86cd799439012", // Different from user ID
        };

        (Asset.findById as jest.Mock).mockResolvedValueOnce(mockAsset);

        await authorizeUploaderOrAdmin(
            mockRequest as Request,
            mockResponse as Response,
            nextFunction
        );

        expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
        expect(nextFunction).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "You are not authorized to delete this asset.",
                statusCode: 403,
            })
        );
    });
});
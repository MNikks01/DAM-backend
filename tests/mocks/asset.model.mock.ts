import { Types } from "mongoose";

export const mockAsset = {
    _id: new Types.ObjectId(),
    originalName: "test-file.jpg",
    fileName: "test-file.jpg",
    mimeType: "image/jpeg",
    size: "1024",
    key: "uploads/2024/1/test-uuid.jpg",
    bucket: "test-bucket",
    path: "uploads/2024/1/test-uuid.jpg",
    versions: { original: "uploads/2024/1/test-uuid.jpg" },
    tags: ["test"],
    category: "image" as const,
    status: "pending" as const,
    uploader: new Types.ObjectId(),
    downloadCount: 0,
    metadata: {},
    team: "test-team",
    save: jest.fn().mockResolvedValue(this),
};

export default {
    findById: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
};
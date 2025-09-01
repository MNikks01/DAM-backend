import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import Asset from "../models/asset.model";
import { enqueueProcessingJob } from "../queue/queue"; // or general asset processing queue
import minioClient, { BUCKET } from "../configs/minio";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../utils/errorHandler";
import mongoose from "mongoose";

// Generate a presigned PUT URL for direct upload to MinIO
export const generatePresignedUrl = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("generatePresignedUrl hit");
    try {
      const { fileName } = req.body;
      if (!fileName) {
        return res.status(400).json({ message: "Filename is required" });
      }

      // Generate a unique key/path for the file
      const ext = path.extname(fileName);
      const id = uuidv4();
      const objectKey = `uploads/${new Date().getFullYear()}/${
        new Date().getMonth() + 1
      }/${id}${ext}`;

      // Generate presigned PUT URL (valid for 5 minutes)
      const url = await minioClient.presignedPutObject(
        BUCKET,
        objectKey,
        60 * 5
      );

      res.status(200).json({ url, key: objectKey });
    } catch (error) {
      next(error);
    }
  }
);

// Confirm the file upload and register it in the database
export const confirmUpload = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("confirmUpload hit");
      if (!req.user) {
        return next(new AppError("Unauthorized", 401));
        // return res.status(401).json({ message: "Unauthorized" });
      }
      const { key, fileName, originalName, mimeType, size, tags, category } =
        req.body;
      const user = req.user?.userId; // assuming `isAuthenticated` adds `user` to req
      if (!key || !fileName || !mimeType || !size || !originalName || !tags) {
        // return next(new AppError("Missing required fields", 400));
        return next(new AppError(`Missing field: fileName`, 400));
        // return res.status(400).json({ message: "Missing required fields" });
      }

      // Create asset record in DB
      const asset = await Asset.create({
        key,
        fileName,
        team: req.user?.team,
        originalName,
        mimeType,
        size: Number(size),
        tags: tags || [],
        category: category || "other",
        uploader: new mongoose.Types.ObjectId(req.user?.userId) || "system",
        status: "pending",
        bucket: process.env.MINIO_BUCKET_NAME || "assets",
        path: key, // you can store the key as path or generate another if needed
        downloadCount: 0,
        metadata: {},
        versions: { original: key },
      });

      // Enqueue processing job (thumbnail, transcode, extract metadata, etc.)
      await enqueueProcessingJob(asset._id.toString());

      return res.status(201).json({
        message: "Upload confirmed and processing started",
        assetId: asset._id,
        status: asset.status,
      });
    } catch (error) {
      next(error);
    }
  }
);

const getPresignedDownloadUrl = async (bucket: string, objectName: string) => {
  try {
    const url = await minioClient.presignedGetObject(
      bucket,
      objectName,
      60 * 5,
      {
        "response-content-disposition": `attachment; filename="${objectName}"`,
      }
    ); // 5 min expiry

    return url;
  } catch (err) {
    throw new Error("Failed to generate download URL");
  }
};

// GET /api/assets/:id/download
export const downloadAsset = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return next(new AppError("Asset not found", 404));
    }

    const bucket = BUCKET; // wherever you're storing this
    // const objectName = asset.fileName; // MinIO object key
    const objectName = asset.key; // MinIO object key

    try {
      const url = await getPresignedDownloadUrl(bucket, objectName);

      // ✅ Increment download count
      asset.downloadCount += 1;
      await asset.save();

      res.status(200).json({
        status: "success",
        url, // return the signed URL to the client
      });
    } catch (err) {
      return next(new AppError("Could not generate download link", 500));
    }
  }
);

// export const getAssets = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {}
// );
// export const searchAssets = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {}
// );
// export const getAsset = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {}
// );
// export const getAssetDownloadUrl = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {}
// );
// export const deleteAsset = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {}
// );

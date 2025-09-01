import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { Worker } from "bullmq";
import redis from "../configs/redis";
import Asset from "../models/asset.model";
import minioClient, { BUCKET } from "../configs/minio";
import { saveStreamToTempFile } from "../utils/saveStreamToTempFile";
import { extractMetaData } from "../utils/metaDataExtractor";
import {
  generateVideoThumbnail,
  generatePdfThumbnail,
  generateTextThumbnail,
  generateDocxThumbnail,
} from "../utils/thumbnailGenerator";
import { MONGODB_URI } from "../configs/configs";
import { promisify } from "util";
import { compressImage, compressVideo } from "../utils/compression";

await mongoose.connect(MONGODB_URI);
console.log("✅ Connected to MongoDB (worker)");

const assetWorker = new Worker(
  "storage-processing",
  async (job) => {
    const { assetId } = job.data;
    console.log(`🚀 Processing asset: ${assetId}`);

    const asset = await Asset.findById(assetId);
    if (!asset) throw new Error("Asset not found");

    // Download object from MinIO
    const objectStream = await minioClient.getObject(BUCKET, asset.key);
    const tempPath = await saveStreamToTempFile(objectStream, asset.fileName);

    // Extract metadata
    const metadata = await extractMetaData(tempPath, asset.mimeType);

    // 3. Compress file if supported
    let compressedPath = tempPath;
    let compressedKey = "";
    const fileExt = path.extname(asset.fileName);
    const compressedFileName = `compressed-${asset._id}${fileExt}`;
    const compressedOutputPath = path.join("/tmp", compressedFileName);

    try {
      if (asset.mimeType.startsWith("image/")) {
        await compressImage(tempPath, compressedOutputPath);
        compressedPath = compressedOutputPath;
      } else if (asset.mimeType.startsWith("video/")) {
        await compressVideo(tempPath, compressedOutputPath);
        compressedPath = compressedOutputPath;
      }

      if (compressedPath !== tempPath && fs.existsSync(compressedPath)) {
        // Upload compressed file to MinIO
        compressedKey = `compressed/${compressedFileName}`;
        const compressedStream = fs.createReadStream(compressedPath);
        await minioClient.putObject(BUCKET, compressedKey, compressedStream);

        asset.versions.compressed = compressedKey;
      }
    } catch (compressionError: any) {
      console.warn("⚠️ Compression failed:", compressionError.message);
    }

    // Prepare thumbnail generation folder
    const tempThumbDir = path.join("/tmp", "thumbnails");
    fs.mkdirSync(tempThumbDir, { recursive: true });

    let thumbnailPath = "";

    try {
      const fileBaseName = path.basename(
        asset.fileName,
        path.extname(asset.fileName)
      );

      if (asset.mimeType.startsWith("video/")) {
        // Video thumbnail (e.g., mp4)
        thumbnailPath = await generateVideoThumbnail(
          tempPath,
          tempThumbDir,
          fileBaseName
        );
      } else if (asset.mimeType === "application/pdf") {
        // PDF thumbnail
        thumbnailPath = await generatePdfThumbnail(
          tempPath,
          tempThumbDir,
          fileBaseName
        );
      } else if (
        asset.mimeType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // DOCX
        asset.mimeType === "application/msword"
      ) {
        // DOCX and older Word formats → convert & generate thumbnail
        thumbnailPath = await generateDocxThumbnail(
          tempPath,
          tempThumbDir,
          fileBaseName
        );
      } else if (asset.mimeType.startsWith("text/")) {
        // Text files
        thumbnailPath = await generateTextThumbnail(
          tempPath,
          tempThumbDir,
          fileBaseName
        );
      }

      if (thumbnailPath && fs.existsSync(thumbnailPath)) {
        // Upload thumbnail to MinIO
        const thumbStream = fs.createReadStream(thumbnailPath);
        const thumbnailKey = `thumbnails/${asset._id}.jpg`;
        await minioClient.putObject(BUCKET, thumbnailKey, thumbStream);

        // Save thumbnail path in versions object
        asset.versions = {
          ...asset.versions,
          thumbnail: thumbnailKey,
        };
      }
    } catch (err: any) {
      console.warn("⚠️ Thumbnail generation failed:", err.message);
    }

    // Generate signed URLs (valid for 7 days)
    // 5. Generate signed URLs
    const presignedUrl = promisify(minioClient.presignedUrl).bind(minioClient);

    const originalUrl = await presignedUrl(
      "GET",
      BUCKET,
      asset.key,
      7 * 24 * 60 * 60
    );
    const compressedUrl = compressedKey
      ? await presignedUrl("GET", BUCKET, compressedKey, 7 * 24 * 60 * 60)
      : "";
    const thumbnailUrl = asset.versions.thumbnail
      ? await presignedUrl(
          "GET",
          BUCKET,
          asset.versions.thumbnail,
          7 * 24 * 60 * 60
        )
      : "";

    asset.downloadUrl = {
      original: originalUrl,
      thumbnail: thumbnailUrl,
      compressed: compressedUrl,
    };

    asset.metadata = metadata;
    asset.status = "processed";
    await asset.save();

    // 6. Cleanup
    fs.unlink(tempPath, () => {});
    if (compressedPath !== tempPath && fs.existsSync(compressedPath)) {
      fs.unlink(compressedPath, () => {});
    }
    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      fs.unlink(thumbnailPath, () => {});
    }

    console.log(`✅ Finished processing asset: ${assetId}`);
  },
  { connection: redis }
);

assetWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

assetWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed: ${err.message}`);
});

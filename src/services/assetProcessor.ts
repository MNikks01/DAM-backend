import fs from "fs";
import minioClient, { BUCKET } from "../configs/minio.js";

import Asset from "../models/asset.model.js";
import type { ProcessAssetJob } from "../types/index.js";
import {
  extractMetaData,
  getFileCategory,
} from "../utils/metaDataExtractor.js";
import path from "path";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import poppler from "pdf-poppler";
import { generateWaveForm } from "../utils/audioProcessor.js";

export const processAsset = async (jobData: ProcessAssetJob) => {
  const { assetId, filePath, originalName, mimeType, uploader } = jobData;
  const bucketName = BUCKET || "assets";

  try {
    // extract metadata
    const metadata = await extractMetaData(filePath, mimeType);
    const category = getFileCategory(mimeType);

    // upload original file to minio
    const originalKey = `originals/${assetId}/${originalName}`;
    await minioClient.fPutObject(bucketName, originalKey, filePath, {
      "Content-Type": mimeType,
      "x-amz-meta-asset-id": assetId,
    });

    const versions: any = {
      original: originalKey,
    };

    switch (category) {
      case "image":
        Object.assign(
          versions,
          await processImage(filePath, assetId, originalName)
        );
        break;
      case "video":
        Object.assign(
          versions,
          await processVideo(filePath, assetId, originalName)
        );
        break;
      case "audio":
        Object.assign(
          versions,
          await processAudio(filePath, assetId, originalName)
        );
        break;
      case "document":
        Object.assign(
          versions,
          await processDocument(filePath, assetId, originalName, mimeType)
        );
        break;
      default:
        console.log("No special processing for filetype: ", mimeType);
        break;
    }

    await Asset.findOneAndUpdate(
      { id: assetId },
      {
        status: "completed",
        category,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration,
        pages: metadata.pages,
        versions,
        tags: metadata.tags,
        metadata,
        $inc: { size: metadata.size },
      }
    );

    // cleanup temporary file
    fs.unlinkSync(filePath);

    return { success: true, assetId, metadata, category };
  } catch (error) {
    // update asset status to failed
    await Asset.findOneAndUpdate({ id: assetId }, { status: "failed" });

    // cleanup on error
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw error;
  }
};

export const processImage = async (
  filePath: string,
  assetId: string,
  originalName: string
): Promise<Record<string, string>> => {
  const bucketName = BUCKET || "assets";
  const baseName = path.parse(originalName).name;
  const versions: Record<string, string> = {};

  // generate thumbnail
  const thumbnailBuffer = await sharp(filePath)
    .resize(300, 300, {
      fit: "inside",
    })
    .jpeg({ quality: 80 })
    .toBuffer();
  const thumbnailKey = `thumbnails/${assetId}/${baseName}.jpg`;
  await minioClient.putObject(
    bucketName,
    thumbnailKey,
    thumbnailBuffer,
    thumbnailBuffer.length,
    {
      "Content-Type": "image/jpeg",
      "x-amz-meta-asset-id": assetId,
    }
  );
  versions.thumbnail = thumbnailKey;

  // generate medium size
  const mediumBuffer = await sharp(filePath)
    .resize(800, 600, {
      fit: "inside",
    })
    .jpeg({ quality: 85 })
    .toBuffer();
  const mediumKey = `medium/${assetId}/${baseName}.jpg`;
  await minioClient.putObject(
    bucketName,
    mediumKey,
    mediumBuffer,
    thumbnailBuffer.length,
    {
      "Content-Type": "image/jpeg",
      "x-amz-meta-asset-id": assetId,
    }
  );
  versions.medium = mediumKey;

  return versions;
};
export const processVideo = async (
  filePath: string,
  assetId: string,
  originalName: string
): Promise<Record<string, string>> => {
  const bucketName = BUCKET || "assets";
  const baseName = path.parse(originalName).name;
  const versions: Record<string, string> = {};

  // generate thumbnail from first frame
  await new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .screenshots({
        timestamps: ["0"],
        filename: `${baseName}_thumb.jpg`,
        folder: "/tmp",
      })
      .on("end", resolve)
      .on("error", reject);
  });
  const thumbPath = `/tmp/${baseName}_thumb.jpg`;
  const thumbKey = `thumbnails/${assetId}/${baseName}.jpg`;
  await minioClient.fPutObject(bucketName, thumbKey, thumbPath, {
    "Content-Type": "image/jpeg",
    "x-amz-meta-asset-id": assetId,
  });
  versions.thumbnail = thumbKey;
  fs.unlinkSync(thumbPath);

  // transcode to multiple resolutions
  const resolutions = [
    { name: "1080p", width: 1920, height: 1080 },
    { name: "720p", width: 1280, height: 720 },
  ];

  for (const res of resolutions) {
    const outputPath = `/tmp/${baseName}_${res.name}.mp4`;

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .size(`${res.width}x${res.height}`)
        .output(outputPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .on("end", resolve)
        .on("error", reject)
        .run();
    });
    const videoKey = `videos/${assetId}/${baseName}_${res.name}.mp4`;
    await minioClient.fPutObject(bucketName, videoKey, outputPath, {
      "Content-Type": "video/mp4",
      "x-amz-meta-asset-id": assetId,
    });
    versions[res.name] = videoKey;
    fs.unlinkSync(outputPath);
  }

  return versions;
};
export const processAudio = async (
  filePath: string,
  assetId: string,
  originalName: string
): Promise<Record<string, string>> => {
  const bucketName = BUCKET || "assets";
  const baseName = path.parse(originalName).name;
  const versions: Record<string, string> = {};

  //   generate waveform image
  try {
    const waveformPath = await generateWaveForm(filePath, assetId);
    const waveformKey = `waveforms/${assetId}/${baseName}.png`;

    await minioClient.fPutObject(bucketName, waveformKey, waveformPath, {
      "Content-Type": "image/png",
      "x-amz-meta-asset-id": assetId,
    });
    versions.waveform = waveformKey;
    fs.unlinkSync(waveformPath);
  } catch (error) {
    console.warn("could not generate waveform :", error);
  }

  return versions;
};

export const processDocument = async (
  filePath: string,
  assetId: string,
  originalName: string,
  mimeType: string
): Promise<Record<string, string>> => {
  const bucketName = BUCKET || "assets";
  const baseName = path.parse(originalName).name;
  const versions: Record<string, string> = {};

  //   generate preview for pdf's
  if (mimeType === "application/pdf") {
    try {
      const outputDir = `/tmp/${assetId}`;
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      //   convert first page to image
      const opts = {
        format: "jpeg",
        out_dir: outputDir,
        out_prefix: baseName,
        page: 1,
      };

      await poppler.convert(filePath, opts);

      const previewPath = path.join(outputDir, `${baseName}-1.jpg`);
      const previewKey = `previews/${assetId}/${baseName}.jpg`;

      await minioClient.fPutObject(bucketName, previewKey, previewPath, {
        "Content-Type": "image/jpeg",
        "x-amz-meta-asset-id": assetId,
      });
      versions.preview = previewKey;

      //   cleanup
      fs.unlinkSync(previewPath);
      fs.rmdirSync(outputDir);
    } catch (error) {
      console.warn("could not generate pdf preview : ", error);
    }
  }

  return versions;
};

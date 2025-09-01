// utils/compression.ts
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

export async function compressImage(inputPath: string, outputPath: string) {
  await sharp(inputPath)
    .resize(1280) // resize if large
    .jpeg({ quality: 70 }) // lower quality
    .toFile(outputPath);
  return outputPath;
}

export async function compressVideo(inputPath: string, outputPath: string) {
  return new Promise<string>((resolve, reject) => {
    ffmpeg(inputPath)
      .videoBitrate("1000k")
      .size("1280x720")
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

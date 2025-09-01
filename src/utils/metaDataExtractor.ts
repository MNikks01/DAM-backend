import fs from "fs";
import sharp from "sharp";
import * as mm from "music-metadata";
import poppler from "pdf-poppler";
// import Ffmpeg from "fluent-ffmpeg";
// import textract from "textract";
import path from "path";

import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath("C:/ffmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("C:/ffmpeg/bin/ffprobe.exe");

export const extractMetaData = async (
  filePath: string,
  mimeType: string
): Promise<Record<string, any>> => {
  const metadata: Record<string, any> = {};

  try {
    const stats = fs.statSync(filePath);
    metadata.size = stats.size;
    metadata.lastModified = stats.mtime.toISOString();

    const filename = path.basename(filePath);
    metadata.fileName = filename;
    const category = getFileCategory(mimeType);
    metadata.tags = generateAssetTags({
      filename,
      mimeType,
      category,
      uploader: "system", // or dynamic value if available
    });

    if (mimeType.startsWith("image/")) {
      const imageMetadata = await sharp(filePath).metadata();
      metadata.width = imageMetadata.width;
      metadata.height = imageMetadata.height;
      metadata.format = imageMetadata.format;
      metadata.space = imageMetadata.space;
      metadata.channels = imageMetadata.channels;
      metadata.density = imageMetadata.density;
      metadata.hasAlpha = imageMetadata.hasAlpha;

      // Optional: EXIF data
      if (imageMetadata.exif) {
        metadata.exif = imageMetadata.exif.toString("base64").slice(0, 100); // preview
      }
    } else if (mimeType.startsWith("video/")) {
      const duration = await getVideoDuration(filePath);
      const dimensions = await getVideoDimensions(filePath);
      const formatDetails = await getVideoMetadata(filePath);

      metadata.duration = duration;
      metadata.format = formatDetails.formatName;
      metadata.codec = formatDetails.videoCodec;
      metadata.audioCodec = formatDetails.audioCodec;
      metadata.frameRate = formatDetails.frameRate;
      metadata.bitRate = formatDetails.bitRate;
      if (dimensions) {
        metadata.width = dimensions.width;
        metadata.height = dimensions.height;
      }
    } else if (mimeType.startsWith("audio/")) {
      const audioMeta = await mm.parseFile(filePath);
      metadata.duration = audioMeta.format.duration;
      metadata.bitrate = audioMeta.format.bitrate;
      metadata.codec = audioMeta.format.codec;
      metadata.sampleRate = audioMeta.format.sampleRate;
      metadata.numberOfChannels = audioMeta.format.numberOfChannels;

      if (audioMeta.common) {
        metadata.title = audioMeta.common.title;
        metadata.artist = audioMeta.common.artist;
        metadata.album = audioMeta.common.album;
        metadata.year = audioMeta.common.year;
        metadata.genre = audioMeta.common.genre?.join(", ");
        metadata.track = audioMeta.common.track?.no;
        metadata.composer = audioMeta.common.composer;
        metadata.hasArtwork = !!audioMeta.common.picture?.length;
      }
    } else if (mimeType === "application/pdf") {
      const pdfInfo = await poppler.info(filePath);
      metadata.pages = pdfInfo.pages;
      metadata.title = pdfInfo.title;
      metadata.author = pdfInfo.author;
      metadata.subject = pdfInfo.subject;
      metadata.keywords = pdfInfo.keywords;
      metadata.creationDate = pdfInfo.creation_date;
      metadata.pdfVersion = pdfInfo.pdf_version;

      // Text indexing
      try {
        const text = await extractText(filePath, mimeType);
        metadata.textContent = text.substring(0, 1000);
        // metadata.language = detectLanguage(text); // Optional
      } catch (error) {
        console.warn("Text extraction failed from PDF:", error);
      }
    } else if (
      mimeType.startsWith("text/") ||
      mimeType.includes("word") ||
      mimeType.includes("excel") ||
      mimeType.includes("powerpoint") ||
      mimeType.includes("openxml")
    ) {
      try {
        const text = await extractText(filePath, mimeType);
        metadata.textContent = text.substring(0, 1000);
        // metadata.language = detectLanguage(text); // Optional
      } catch (error) {
        console.warn("Text extraction failed from document:", error);
      }
    }
  } catch (error) {
    metadata.error = error instanceof Error ? error.message : String(error);
    console.error("Error extracting metadata:", error);
  }

  return metadata;
};

const getVideoDuration = async (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err || !metadata?.format) {
        return reject(err || new Error("No metadata found"));
      }
      resolve(metadata.format.duration || 0);
    });
  });
};

const getVideoDimensions = async (
  filePath: string
): Promise<{ width: number; height: number } | null> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video"
      );
      if (videoStream) {
        resolve({
          width: videoStream.width || 0,
          height: videoStream.height || 0,
        });
      } else {
        resolve(null);
      }
    });
  });
};

const getVideoMetadata = async (
  filePath: string
): Promise<{
  formatName?: string;
  videoCodec?: string;
  audioCodec?: string;
  frameRate?: number;
  bitRate?: number;
}> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find(
        (s) => s.codec_type === "video"
      );
      const audioStream = metadata.streams.find(
        (s) => s.codec_type === "audio"
      );

      const result: {
        formatName?: string;
        videoCodec?: string;
        audioCodec?: string;
        frameRate?: number;
        bitRate?: number;
      } = {};

      if (metadata.format?.format_name)
        result.formatName = metadata.format.format_name;
      if (videoStream?.codec_name) result.videoCodec = videoStream.codec_name;
      if (audioStream?.codec_name) result.audioCodec = audioStream.codec_name;
      const rawBitrate = metadata.format.bit_rate;
      if (typeof rawBitrate === "number") {
        result.bitRate = rawBitrate;
      } else if (typeof rawBitrate === "string") {
        const parsed = parseInt(rawBitrate);
        if (!isNaN(parsed)) result.bitRate = parsed;
      }
      if (videoStream?.r_frame_rate) {
        const [numStr, denomStr] = videoStream.r_frame_rate.split("/") ?? [];
        const num = Number(numStr);
        const denom = Number(denomStr);
        if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
          result.frameRate = num / denom;
        }
      }
      resolve(result);
    });
  });
};

const extractText = async (
  filePath: string,
  mimeType: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // textract.fromFileWithMimeAndPath(mimeType, filePath, (err, text) => {
    //   if (err) reject(err);
    //   resolve(text || "");
    // });
  });
};

const generateAssetTags = ({
  filename,
  mimeType,
  category,
  uploader = "system",
  date = new Date(),
}: {
  filename: string;
  mimeType: string;
  category: string;
  uploader?: string;
  date?: Date;
}): string[] => {
  const tags: Set<string> = new Set();

  // From filename
  const nameWithoutExt = filename.split(".").slice(0, -1).join(".");
  const words = nameWithoutExt.split(/[_\-\s]+/);
  for (const word of words) {
    if (word.length > 2 && /^[a-zA-Z0-9]+$/.test(word)) {
      tags.add(word.toLowerCase());
    }
  }

  // From MIME type and extension
  const ext = path.extname(filename).slice(1).toLowerCase();
  if (ext) tags.add(ext);
  if (mimeType) tags.add(mimeType.toLowerCase());

  // Category
  tags.add(category.toLowerCase());

  // Uploader
  tags.add(`uploader:${uploader}`);

  // Date-based tags
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  tags.add(`year:${year}`);
  tags.add(`month:${month}`);

  return Array.from(tags);
};

const getFileCategory = (mimeType: string): string => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "document";

  if (
    mimeType.startsWith("text/") ||
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("powerpoint")
  ) {
    return "document";
  }
  return "other";
};

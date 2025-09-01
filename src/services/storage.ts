import type { Readable } from "stream";
import { lookup as mimeLookup } from "mime-types";
import minioClient, { BUCKET } from "../configs/minio";

// ensure bucket exists on boot
export const ensureBucket = async () => {
  const exists = await minioClient.bucketExists(BUCKET).catch(() => false);
  if (!exists) {
    await minioClient.makeBucket(BUCKET, "us-east-1");
    console.log(`Bucket ${BUCKET} created`);
  }
};

// upload from a local file path (created by multer disk storage)
const uploadFromPath = async (
  objectName: string,
  localPath: string,
  mime?: string
) => {
  const meta = mime ? { "Content-Type": mime } : {};
  await minioClient.fPutObject(BUCKET, objectName, localPath, meta);

  return { key: objectName };
};

// upload from buffer (multer memory storage)
const uploadFromBuffer = async (
  objectName: string,
  buffer: Buffer,
  mime?: string
) => {
  const meta = mime ? { "Content-Type": mime } : {};
  await minioClient.putObject(BUCKET, objectName, buffer, buffer.length, meta);

  return { key: objectName };
};

const getObjectStream = async (key: string): Promise<Readable> => {
  const stream = await minioClient.getObject(BUCKET, key);
  return stream;
};

// presigned GET (temporary public URL)
const presignedGetURL = async (key: string, expiresInSeconds = 3600) => {
  return minioClient.presignedGetObject(BUCKET, key, expiresInSeconds);
};

// presigned PUT (temporary public URL)
const presignedPUTURL = async (key: string, expiresInSeconds = 3600) => {
  return minioClient.presignedPutObject(BUCKET, key, expiresInSeconds);
};

// content-Type helper
const detectMime = async (filename: string) => {
  return mimeLookup(filename) || "application/octet-stream";
};

import { Client } from "minio";
import {
  MINIO_ACCESS_KEY,
  MINIO_BUCKET,
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_SECRET_KEY,
  MINIO_USE_SSL,
} from "./configs";

const minioClient = new Client({
  endPoint: MINIO_ENDPOINT,
  port: Number(MINIO_PORT || 9000),
  useSSL: MINIO_USE_SSL === "true",
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

export const BUCKET = MINIO_BUCKET || "app-media";
export default minioClient;

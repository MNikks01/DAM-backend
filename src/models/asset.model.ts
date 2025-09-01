import { Schema, model, Document, Types } from "mongoose";

export interface IAsset extends Document {
  _id: Types.ObjectId;
  originalName: string;
  team: string;
  key: string;
  fileName: string;
  mimeType: string;
  size: string;
  width?: number;
  height?: number;
  duration?: number;
  pages?: number;
  bucket: string;
  path: string;
  versions: {
    original: string;
    thumbnail?: string;
    medium?: string;
    "1080"?: string;
    "720"?: string;
    preview?: string;
    waveform?: string;
    compressed?: string;
  };
  downloadUrl: {
    thumbnail?: string;
    original?: string;
    compressed?: string;
  };
  tags: string[];
  metadata: Record<string, any>;
  category: "image" | "video" | "audio" | "document" | "archive" | "other";
  status: "processing" | "pending" | "failed" | "processed";
  uploader: string;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema: Schema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    team: { type: String, required: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: String, required: true },
    width: Number,
    height: Number,
    key: { type: String, required: true },
    duration: Number,
    pages: Number, // for PDFs and document
    bucket: { type: String, required: true, default: "assets" },
    path: { type: String, required: true },
    versions: {
      original: { type: String, required: true },
      thumbnail: String,
      medium: String,
      "1080": String,
      "720": String,
      preview: String, // for PDFs and document
      waveform: String, // for audio
      compressed: String,
    },
    downloadUrl: {
      original: { type: String, default: "" },
      thumbnail: { type: String, default: "" },
      compressed: { type: String, default: "" },
    },
    tags: [{ type: String }],
    metadata: { type: Schema.Types.Mixed, default: {} },
    category: {
      type: String,
      enum: ["image", "video", "audio", "document", "archive", "other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["processing", "pending", "failed", "processed"],
      default: "processing",
    },
    uploader: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AssetSchema.index({ mimeType: 1 });
AssetSchema.index({ category: 1 });
AssetSchema.index({ tags: 1 });
AssetSchema.index({ createdAt: 1 });
AssetSchema.index({ status: 1 });

const Asset = model<IAsset>("Asset", AssetSchema);
export default Asset;

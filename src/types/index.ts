export interface Asset {
  _id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: string;
  width?: number;
  height?: number;
  duration?: number;
  page?: number;
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
  };
  tags: string[];
  metadata: Record<string, any>;
  category: "image" | "video" | "audio" | "document" | "archive" | "other";
  status: "processing" | "pending" | "failed";
  uploader: string;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsData {
  date: Date;
  uploads: number;
  downloads: number;
  totalAssets: number;
  totalStorage: number;
  popularTags: string[];
  assetTypes: {
    image: number;
    video: number;
    audio: number;
    document: number;
    other: number;
  };
}

export interface ProcessAssetJob {
  assetId: string;
  filePath: string;
  originalName: string;
  mimeType: string;
  uploader: string;
}

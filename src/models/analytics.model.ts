import { Schema, model, Document } from "mongoose";

export interface IAnalytics extends Document {
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

const AnalyticSchema: Schema = new Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  uploads: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  totalAssets: { type: Number, default: 0 },
  totalStorage: { type: Number, default: 0 },
  popularTags: [{ type: String }],
  assetTypes: {
    image: { type: Number, default: 0 },
    video: { type: Number, default: 0 },
    audio: { type: Number, default: 0 },
    document: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
});

export default model<IAnalytics>("Analytics", AnalyticSchema);

import type { NextFunction, Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../utils/errorHandler";
import Asset from "../models/asset.model";

// Utility: Build Mongoose query filters
const buildAssetQuery = (query: any, userTeam: string, isAdmin: boolean) => {
  const filter: Record<string, any> = {};

  // Apply team filter only if user is NOT an admin
  if (!isAdmin) {
    if (!userTeam) {
      throw new Error("Team is required for non-admins.");
    }
    filter.team = userTeam;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.uploader) {
    filter.uploader = query.uploader;
  }

  if (query.tags) {
    const tags = Array.isArray(query.tags) ? query.tags : [query.tags];
    filter.tags = { $all: tags };
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search, "i");
    filter.$or = [
      { originalName: searchRegex },
      { fileName: searchRegex },
      { tags: searchRegex },
    ];
  }

  return filter;
};

// GET /api/assets?page=1&limit=20&sort=createdAt&category=image&status=processed&q=sunset
export const getAssets = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    const team = req.user?.team;

    console.log("req.query", req.query);

    const isAdmin = role === "admin";

    // Only enforce team presence for non-admins
    if (!isAdmin && !team) {
      return next(new AppError("No team found", 400));
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;
    const sortBy = (req.query.sort as string) || "-createdAt";

    const filter = buildAssetQuery(req.query, team || "", isAdmin);

    const [assets, total] = await Promise.all([
      // Asset.find(filter).sort(sortBy).skip(skip).limit(limit),
      Asset.find(filter)
        .populate("uploader", "email") // only get the email field
        .sort(sortBy)
        .skip(skip)
        .limit(limit),
      Asset.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      results: assets.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: { assets },
    });
  }
);

// GET /api/assets/:id
export const getAsset = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return next(new AppError("No asset found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: { asset },
    });
  }
);

// GET /api/assets/:id/download-url
export const getAssetDownloadUrl = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const asset = await Asset.findById(req.params.id);

    if (!asset || !asset.versions?.original) {
      return next(new AppError("Download URL not available", 404));
    }

    asset.downloadCount += 1;
    await asset.save();

    res.status(200).json({
      status: "success",
      data: { downloadUrl: asset.versions.original },
    });
  }
);

// DELETE /api/assets/:id
export const deleteAsset = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const asset = req.asset; // 👈 Provided by the middleware

    if (!asset) {
      return next(new AppError("Asset not loaded", 500));
    }

    await asset.deleteOne();

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

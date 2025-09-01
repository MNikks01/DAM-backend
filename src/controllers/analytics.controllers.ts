// import type { NextFunction, Request, Response } from "express";
// import catchAsync from "../utils/catchAsync.js";
// import { AppError } from "../utils/errorHandler.js";

// export const getUploadAnalytics = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {}
// );
// export const getStorageAnalytics = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {}
// );

// controllers/adminController.js

// import Asset from "../models/asset.model.js"; // Your Asset model
// import { formatDistanceToNow } from "date-fns"; // Optional, for human-readable time

import User from "../models/auth.model";
import type { Request, Response } from "express";
import { formatDistanceToNow, startOfToday } from "date-fns";
import Asset from "../models/asset.model"; // adjust path
import catchAsync from "../utils/catchAsync"; // adjust path
// import User from '../models/user.model';

// import { Request, Response } from 'express';
// import {  } from "date-fns";
// import { formatDistanceToNow } from 'date-fns';
// import Asset from '../models/asset.model';
// import User from '../models/user.model';
// import catchAsync from '../utils/catchAsync';

export const getAdminDashboardStats = catchAsync(
  async (req: Request, res: Response) => {
    const todayStart = startOfToday();

    const [
      totalAssets,
      downloadsAgg,
      sizeAgg,
      typeAgg,
      latestAssets,
      recentUploads,
      recentDownloads,
      todaysDownloadsAgg,
    ] = await Promise.all([
      Asset.countDocuments(),

      Asset.aggregate([
        { $group: { _id: null, total: { $sum: "$downloadCount" } } },
      ]),

      Asset.aggregate([
        { $group: { _id: null, total: { $sum: { $toDouble: "$size" } } } },
      ]),

      Asset.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),

      Asset.find().sort({ createdAt: -1 }).limit(5),

      Asset.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("originalName uploader createdAt"),

      Asset.find({ downloadCount: { $gt: 0 } })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("originalName uploader updatedAt"),

      Asset.aggregate([
        {
          $match: {
            updatedAt: { $gte: todayStart },
            downloadCount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$downloadCount" },
          },
        },
      ]),
    ]);

    // Collect all uploader IDs from recent uploads & downloads
    const uploaderIds = new Set<string>();
    [...recentUploads, ...recentDownloads].forEach((asset) => {
      if (asset.uploader) uploaderIds.add(asset.uploader);
    });

    // Fetch uploader emails
    const users = await User.find({
      _id: { $in: Array.from(uploaderIds) },
    }).select("email");

    const userEmailMap = new Map<string, string>();
    users.forEach((user) => {
      userEmailMap.set(user._id.toString(), user.email);
    });

    const recentActivity = [
      ...recentUploads.map((item) => ({
        action: "Upload",
        user: userEmailMap.get(item.uploader) || "system",
        asset: item.originalName,
        time: formatDistanceToNow(new Date(item.createdAt), {
          addSuffix: true,
        }),
      })),
      ...recentDownloads.map((item) => ({
        action: "Download",
        user: userEmailMap.get(item.uploader) || "system",
        asset: item.originalName,
        time: formatDistanceToNow(new Date(item.updatedAt), {
          addSuffix: true,
        }),
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    const assetTypes = typeAgg.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    return res.status(200).json({
      success: true,
      error: null,
      data: {
        totalAssets,
        totalDownloads: downloadsAgg[0]?.total || 0,
        todaysDownloads: todaysDownloadsAgg[0]?.total || 0,
        totalStorageGB: (sizeAgg[0]?.total || 0) / 1024 ** 3,
        assetTypes,
        latestAssets,
        recentActivity,
      },
    });
  }
);

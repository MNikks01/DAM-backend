// import type { Request, Response, NextFunction } from "express";
// import Asset from "../models/asset.model.js";
// import { AppError } from "../utils/errorHandler.js";

// export const authorizeUploaderOrAdmin = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const assetId = req.params.id;

//   const asset = await Asset.findById(assetId);

//   if (!asset) {
//     return next(new AppError("Asset not found", 404));
//   }

//   const user = req.user;

//   if (!user) {
//     return next(new AppError("Unauthorized", 401));
//   }

//   const isUploader = asset.uploader === user.userId;
//   const isAdmin = user.role === "admin";

//   if (!isUploader && !isAdmin) {
//     return next(
//       new AppError("You are not authorized to delete this asset", 403)
//     );
//   }

//   // Optionally attach asset to request for use in controller
//   req.asset = asset;

//   next();
// };

// import type { Request, Response, NextFunction } from "express";
// import Asset from "../models/asset.model.js";
// import { AppError } from "../utils/errorHandler.js";
// export const authorizeUploaderOrAdmin = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const assetId = req.params.id;
//   const asset = await Asset.findById(assetId);
//   if (!asset) {
//     return next(new AppError("Asset not found", 404));
//   }
//   const user = req.user;
//   if (!user) {
//     return next(new AppError("Unauthorized", 401));
//   }
//   const isUploader = asset.uploader === user.userId;
//   const isAdmin = user.role === "admin";
//   if (!isUploader && !isAdmin) {
//     return next(
//       new AppError("You are not authorized to delete this asset", 403)
//     );
//   }
//   // Optionally attach asset to request for use in controller
//   req.asset = asset;
//   next();
// };

import type { Request, Response, NextFunction } from "express";
import Asset from "../models/asset.model";
import { AppError } from "../utils/errorHandler";

export const authorizeUploaderOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return next(new AppError("No asset found with that ID", 404));
  }

  const user = req.user;

  const isUploader = asset.uploader === user?.userId; // 👈 match this to JWT payload key
  const isAdmin = user?.role === "admin";

  if (!isUploader && !isAdmin) {
    return next(
      new AppError("You are not authorized to delete this asset.", 403)
    );
  }

  req.asset = asset; // 👈 attach to request
  next();
};

import express from "express";
import { authenticateJWT } from "../utils/jwt";
import {
  deleteAsset,
  getAsset,
  getAssetDownloadUrl,
  getAssets,
  // searchAssets,
} from "../controllers/asset.controllers";
import { authorizeUploaderOrAdmin } from "../middlewares/authorizeUploaderOrAdmin";

const router = express.Router();

router.use(authenticateJWT);

router.get("/assets", getAssets);
// router.get("/assets/search", searchAssets);
router.get("/assets/:id", getAsset);
router.get("/assets/:id/download", getAssetDownloadUrl);
router.delete("/assets/:id", authorizeUploaderOrAdmin, deleteAsset); // 👈 protected route

export default router;

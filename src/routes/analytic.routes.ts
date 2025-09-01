import express from "express";

import { authenticateJWT } from "../utils/jwt";
import { authorizeUploaderOrAdmin } from "../middlewares/authorizeUploaderOrAdmin";
import { getAdminDashboardStats } from "../controllers/analytics.controllers";

const router = express.Router();

router.use(authenticateJWT);
// router.use(authorizeUploaderOrAdmin);

// router.get("/analytics/upload", getUploadAnalytics);
// router.get("/analytics/storage", getStorageAnalytics);

router.get("/", getAdminDashboardStats);

export default router;

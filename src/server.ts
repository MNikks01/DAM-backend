import dotenv from "dotenv";
dotenv.config();

import connectDB from "./configs/db.js";
import app from "./app.js";
import { PORT } from "./configs/configs.js";
import { ensureBucket } from "./services/storage.js";

const port = PORT || 5001;

connectDB()
  .then(() => {
    console.log("mongodb connected successfully");

    return ensureBucket();
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });

// import dotenv from "dotenv";
// dotenv.config();

// import express, {
//   type Request,
//   type Response,
//   type Application,
// } from "express";
// import cookieParser from "cookie-parser";
// import path from "path";
// import { fileURLToPath } from "url";
// import multer from "multer";
// import helmet from "helmet";
// import cors from "cors";
// import connectDB from "./configs/db.js";
// import authRoutes from "./routes/auth.routes.js";
// import analyticsRoutes from "./routes/analytic.routes.js";
// import storageRoutes from "./routes/storage.routes.js";
// import assetRoutes from "./routes/asset.routes.js";
// import { CLIENT_URL, PORT } from "./configs/configs.js";
// import { globalErrorHandler } from "./utils/errorHandler.js";
// import { apiLimiter } from "./configs/rateLimiter.js";
// import { ensureBucket } from "./services/storage.js";

// const server: Application = express();
// // const upload = multer({ dest: "uploads/" });

// // // connect to DB and start server
// connectDB()
//   .then(() => {
//     console.log("mongodb connected successfully");
//   })
//   .catch((error) => {
//     console.error("mongodb connection failed:", error);
//     process.exit(1);
//   });

// // CORS setup
// server.use(
//   cors({
//     origin: CLIENT_URL,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//     credentials: true, // Allow cookies, authorization headers
//     optionsSuccessStatus: 200, // Some legacy browsers choke on 204
//   })
// );

// // // middlewares
// server.use(helmet());
// server.use(express.json());
// server.use(express.urlencoded({ extended: true }));
// server.use(cookieParser());

// // // health check
// server.get("/health", (req: Request, res: Response) =>
//   res.json({ status: "OK" })
// );

// // RATE LIMITER
// server.use("/api", apiLimiter);

// // server static files
// // Recreate __dirname for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// server.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // // routes
// const API_PREFIX = "/api/v1";
// server.use(`${API_PREFIX}/users`, authRoutes);
// server.use(`${API_PREFIX}/storage`, storageRoutes);
// server.use(`${API_PREFIX}/asset`, assetRoutes);
// server.use(`${API_PREFIX}/analytics`, analyticsRoutes);

// // 404 handler
// // server.all("*", (req: Request, res: Response) => {
// //   res.status(404).json({ message: "Route not found" });
// // });

// // // global error handler
// server.use(globalErrorHandler);

// const port = PORT || 5001;
// ensureBucket()
//   .then(() =>
//     server.listen(port, () => {
//       console.log(`server running on port ${port}`);
//     })
//   )
//   .catch((e) => {
//     console.error("Bucket init failed: ", e);
//     process.exit(1);
//   });

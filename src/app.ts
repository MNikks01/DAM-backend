import express, {
  type Request,
  type Response,
  type Application,
  type NextFunction,
  type ErrorRequestHandler,
} from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import analyticsRoutes from "./routes/analytic.routes";
import storageRoutes from "./routes/storage.routes";
import assetRoutes from "./routes/asset.routes";

import { CLIENT_URL } from "./configs/configs";
import { globalErrorHandler } from "./utils/errorHandler";
import { apiLimiter } from "./configs/rateLimiter";

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();

// CORS setup
app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/health", (req: Request, res: Response) => res.json({ status: "OK" }));

// Rate limiter
app.use("/api", apiLimiter);

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const API_PREFIX = "/api/v1";
app.use(`${API_PREFIX}/users`, authRoutes);
app.use(`${API_PREFIX}/storage`, storageRoutes);
app.use(`${API_PREFIX}/asset`, assetRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);

app.use(
  (
    err: ErrorRequestHandler,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.error("Error caught:", err);
    next(err);
  }
);

// Global error handler
app.use(globalErrorHandler);

export default app;

import express from "express";
import {
  // getUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  // updateProfile,
  refreshTokenHandler,
  // uploadProfilePic,
} from "../controllers/auth.controllers";
// import { authenticateJWT } from "../utils/jwt.js";
import { validate } from "../middlewares/validate";
import {
  loginSchema,
  registerSchema,
  // updateSchema,
} from "../validators/auth.validator";
import { loginLimiter } from "../configs/rateLimiter";
// import { upload } from "../configs/upload.js";

const router = express.Router();

router.post("/register", loginLimiter, validate(registerSchema), registerUser);

router.post("/login", loginLimiter, validate(loginSchema), loginUser);
router.post("/logout", logoutUser);
// router.get("/profile", authenticateJWT, getUserProfile);
// router.patch("/update", authenticateJWT, validate(updateSchema), updateProfile);
// router.post(
//   "/upload-picture",
//   authenticateJWT,
//   upload.single("profilePicture"),
//   uploadProfilePic
// );
router.post("/refresh-token", refreshTokenHandler);

export default router;

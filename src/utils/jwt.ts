import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { JWT_ACCESS_SECRET_KEY } from "../configs/configs";
import type { SignOptions } from "jsonwebtoken";

interface Payload {
  userId: string;
  role?: string;
  team: string;
}

export const generateToken = (
  payload: Payload,
  secret: string,
  expiresIn: SignOptions["expiresIn"] = "2m"
) => {
  return jwt.sign(payload, secret, { expiresIn: expiresIn }); // ✅ Works fine
};

export const verifyToken = (token: string, secret: string): Payload => {
  try {
    const decoded = jwt.verify(token, secret) as Payload;
    return decoded;
  } catch (error) {
    console.log("JWT verification failed : ", error);
    throw new Error("Invalid or Expired Token");
  }
};

export interface AuthRequest extends Request {
  user?: { userId: string; role?: string; team: string };
  token?: string;
}

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("req.cookies", req.cookies);

  const token = req.cookies.token;
  console.log("token", token);

  // if (typeof authHeader !== "string" || !authHeader.startsWith("token=")) {
  //   return res.status(401).json({
  //     message: "token missing or malformed",
  //   });
  // }

  // const token: string = authHeader.split("=")[1]!;

  try {
    const user = verifyToken(token, JWT_ACCESS_SECRET_KEY);
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ message: error || "invalid or expired token" });
  }
};

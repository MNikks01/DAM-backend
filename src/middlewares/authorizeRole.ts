import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errorHandler";

// Usage: authorizeRole("admin") or authorizeRole("admin", "editor")
export const authorizeRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return next(new AppError("Unauthorized. No user info found.", 401));
    }

    const userRole = user.role;
    if (!userRole) {
      return next(new AppError("Forbidden. You don't have permission.", 403));
    }

    if (!allowedRoles.includes(userRole)) {
      return next(new AppError("Forbidden. You don't have permission.", 403));
    }

    next();
  };
};

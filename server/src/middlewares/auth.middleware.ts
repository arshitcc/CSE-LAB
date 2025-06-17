import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/async-handler";
import { ApiResponse } from "../utils/api-response";
import { ACCESS_TOKEN_SECRET } from "../utils/env";
import { ApiError } from "../utils/api-error";
import { CustomRequest } from "../app/routes/auth/controller";
import { db } from "../db/db";
import { UserRoles } from "../generated/prisma";
import { SecretUser } from "../types";

const authenticateUser = asyncHandler(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token?.trim()) {
      return res
        .status(400)
        .json(new ApiResponse(401, false, "Unauthorized Token"));
    }

    const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET!) as SecretUser;

    if (!decodedToken) {
      return res
        .status(400)
        .json(new ApiResponse(401, false, "Unauthorized Token"));
    }

    const user = await db.user.findUnique({
      where: { id: decodedToken.id },
    });

    if (!user) {
      return res
        .status(400)
        .json(new ApiResponse(404, false, "User not found"));
    }

    req.user = user;
    next();
  },
);

const verifyPermission = (roles: UserRoles[] = []) =>
  asyncHandler(
    async (req: CustomRequest, res: Response, next: NextFunction) => {
      if (req.user.role === UserRoles.ADMIN) {
        // A global ADMIN does not need a permission, they can do everything.
        return next();
      }

      if (!req.user?.id) {
        throw new ApiError(401, "Unauthorized request");
      }

      if (!roles.includes(req.user.role)) {
        throw new ApiError(403, "Unauthorized action");
      }

      // TODO : Check authroization to controller

      next();
    },
  );

export { authenticateUser, verifyPermission };

import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import asyncHandler from "../../../utils/async-handler";
import { ApiError } from "../../../utils/api-error";
import { ApiResponse } from "../../../utils/api-response";
import { NODE_ENV, REFRESH_TOKEN_SECRET } from "../../../utils/env";
import {
  emailVerificationTemplate,
  resetPasswordTemplate,
  sendEmail,
} from "../../../utils/mail";
import { deleteFile, uploadFile } from "../../../utils/cloudinary";
import { db } from "../../../db/db";
import { User, UserAuthTypes, UserRoles } from "../../../generated/prisma";
import {
  generateAccessAndRefreshTokens,
  generateTemporaryToken,
} from "../../../utils/schema.utils";

export interface CustomRequest extends Request {
  user: User;
}

export const AvailableUserRoles = Object.values(UserRoles);

export const userIgnore = {
  password: false,
  refreshToken: false,
  emailVerificationToken: false,
  emailVerificationExpiry: false,
  forgotPasswordToken: false,
  forgotPasswordExpiry: false,
};

const userRegister = asyncHandler(async (req: Request, res: Response) => {
  const { fullname, email, username, password } = req.body;

  const existedUser = await db.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      fullname,
      email,
      username,
      password: hashedPassword,
      loginType: UserAuthTypes.CREDENTIALS,
    },
  });

  const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: tokenExpiry,
    },
  });

  await sendEmail({
    email,
    subject: "Email Verification",
    template: emailVerificationTemplate({
      username: user.username,
      emailVerificationToken: unHashedToken,
    }),
  });

  const createdUser = await db.user.findUnique({
    where: {
      id: user.id,
    },
    select: userIgnore,
  });

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        true,
        "Account Registration Successful !! Please verify your email.",
        createdUser,
      ),
    );
});

const userLogin = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  const existedUser = await db.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  if (!existedUser) {
    throw new ApiError(401, "Account doesn't exist");
  }

  if (existedUser.loginType !== UserAuthTypes.CREDENTIALS) {
    throw new ApiError(
      400,
      "You have previously registered using " +
        existedUser.loginType?.toLowerCase() +
        ". Please use the " +
        existedUser.loginType?.toLowerCase() +
        " login option to access your account.",
    );
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    existedUser.password,
  );

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid Credentials");
  }

  const { accessToken, refreshToken } =
    generateAccessAndRefreshTokens(existedUser);

  const user = await db.user.findUnique({
    where: {
      id: existedUser.id,
    },
    select: userIgnore,
  });

  const options = {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "none" as const,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, true, "User Authenticated Successfully", user));
});

const userLogout = asyncHandler(async (req: CustomRequest, res: Response) => {
  await db.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, true, "Logout Successful"));
});

const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";

  if (!token?.trim()) {
    throw new ApiError(400, "Email verification token is missing");
  }

  let hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await db.user.findFirst({
    where: {
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw new ApiError(404, "Invalid Token or Verification time is expired");
  }

  if (user.isEmailVerified) {
    throw new ApiError(489, "Email is already verified!");
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: null,
      emailVerificationExpiry: null,
      isEmailVerified: true,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, true, "Email is verified", {
      isEmailVerified: true,
    }),
  );
});

const resendVerificationEmail = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const user = await db.user.findFirst({
      where: { id: req.user.id, isEmailVerified: false },
    });

    if (!user) {
      throw new ApiError(404, "Account does not exists", []);
    }

    if (user.isEmailVerified) {
      throw new ApiError(489, "Email is already verified!");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
      generateTemporaryToken();

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: tokenExpiry,
      },
    });

    await sendEmail({
      email: user.email,
      subject: "Email Verification",
      template: emailVerificationTemplate({
        username: user.username,
        emailVerificationToken: unHashedToken,
      }),
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Verification Mail has been sent to your registred email-ID",
        ),
      );
  },
);

const updateRefreshAndAccessToken = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET!) as {
      id: string;
    };

    const user = await db.user.findFirst({
      where: { id: decodedToken.id, refreshToken },
    });

    if (!user) {
      throw new ApiError(401, "Invalid Token");
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      generateAccessAndRefreshTokens(user);

    const options = {
      httpOnly: true,
      secure: NODE_ENV === "production",
    };

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, true, "Access token refreshed"));
  },
);

const forgotPasswordRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(404, "Account doesn't exists");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
      generateTemporaryToken();

    await db.user.update({
      where: { id: user.id },
      data: {
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: tokenExpiry,
      },
    });

    await sendEmail({
      email,
      subject: "Password Reset",
      template: resetPasswordTemplate({
        username: user.username,
        resetPasswordToken: unHashedToken,
      }),
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Password reset mail has been sent on your mail id",
        ),
      );
  },
);

const resetForgottenPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const { newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await db.user.findFirst({
      where: {
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new ApiError(
        404,
        "Invalid Token or Password Verification time is expired",
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: {
        forgotPasswordToken: null,
        forgotPasswordExpiry: null,
        password: hashedNewPassword,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, true, "Password reset successfully"));
  },
);

const changeCurrentPassword = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const { oldPassword, newPassword } = req.body;

    const exisitingUser = await db.user.findUnique({
      where: { id: req.user.id },
    });

    if (!exisitingUser) {
      throw new ApiError(401, "Invalid Account");
    }
    const isPasswordCorrect = await bcrypt.compare(
      oldPassword,
      exisitingUser.password,
    );

    if (!isPasswordCorrect) {
      throw new ApiError(401, "Wrong Password");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: exisitingUser.id },
      data: { password: hashedNewPassword },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, true, "Password changed successfully"));
  },
);

const assignRole = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!AvailableUserRoles.includes(role)) {
    throw new ApiError(400, "Invalid Role");
  }

  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  await db.user.update({
    where: { id: user.id },
    data: { role },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, true, "Role assigned successfully!!"));
});

const getCurrentUser = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const user = await db.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, true, "Account fetched successfully", user));
  },
);

const changeAvatar = asyncHandler(async (req: CustomRequest, res: Response) => {
  if (!req.file || !req.file.path) {
    throw new ApiError(400, "Profile Image is required !!");
  }

  const avatarPath = req.file?.path || "";
  const avatar = await uploadFile(avatarPath);

  const updatedUser = await db.user.update({
    where: { id: req.user.id },
    data: {
      avatar: {
        publicid: avatar.publicid,
        url: avatar.url,
        format: avatar.format,
        resource_type: avatar.resource_type,
      },
    },
    select: userIgnore,
  });

  const { old_avatar_publicid } = req.body;
  if (old_avatar_publicid)
    await deleteFile(old_avatar_publicid, avatar.resource_type);

  return res
    .status(200)
    .json(
      new ApiResponse(200, true, "Avatar updated successfully", updatedUser),
    );
});

export {
  userRegister,
  userLogin,
  userLogout,
  verifyEmail,
  resendVerificationEmail,
  updateRefreshAndAccessToken,
  forgotPasswordRequest,
  resetForgottenPassword,
  changeCurrentPassword,
  assignRole,
  getCurrentUser,
  changeAvatar,
};

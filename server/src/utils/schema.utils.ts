import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_SECRET,
  EMAIL_VERIFICATION_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
} from "./env";
import { SecretUser } from "../types";

const generateAccessToken = (user: SecretUser) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    ACCESS_TOKEN_SECRET!,
    { expiresIn: eval(ACCESS_TOKEN_EXPIRY!) },
  );
};

const generateRefreshToken = (user: { id: string }) => {
  return jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET!, {
    expiresIn: eval(REFRESH_TOKEN_EXPIRY!),
  });
};

export const generateTemporaryToken = () => {
  const unHashedToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha512")
    .update(unHashedToken)
    .digest("hex");

  const tokenExpiry =
    Date.now() + Number(eval(EMAIL_VERIFICATION_TOKEN_EXPIRY!));

  return { unHashedToken, hashedToken, tokenExpiry: new Date(tokenExpiry) };
};

export const generateAccessAndRefreshTokens = (user: SecretUser) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return { accessToken, refreshToken };
};

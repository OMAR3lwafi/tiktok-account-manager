import { Header, APIError } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";
import jwt from "jsonwebtoken";

const jwtSecret = secret("JWT_SECRET");

interface JWTPayload {
  userId: number;
  email: string;
}

function verifyJWT(token: string): JWTPayload {
  return jwt.verify(token, jwtSecret()) as JWTPayload;
}

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  userId: number;
  email: string;
}

export const auth = authHandler<AuthParams, AuthData>(
  async (params) => {
    const token = params.authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const payload = verifyJWT(token);
      return {
        userID: payload.userId.toString(),
        userId: payload.userId,
        email: payload.email,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token");
    }
  }
);

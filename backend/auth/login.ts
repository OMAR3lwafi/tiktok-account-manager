import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db";

const jwtSecret = secret("JWT_SECRET");

interface JWTPayload {
  userId: number;
  email: string;
}

function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, jwtSecret(), { expiresIn: "7d" });
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
  };
}

// Authenticates a user with email and password.
export const login = api<LoginRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    const { email, password } = req;

    if (!email || !password) {
      throw APIError.invalidArgument("email and password are required");
    }

    const user = await db.queryRow<{ id: number; email: string; password_hash: string }>`
      SELECT id, email, password_hash FROM users WHERE email = ${email.toLowerCase()}
    `;

    if (!user) {
      throw APIError.unauthenticated("invalid email or password");
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw APIError.unauthenticated("invalid email or password");
    }

    const token = signJWT({ userId: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
);

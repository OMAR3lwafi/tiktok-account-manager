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

export interface RegisterRequest {
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

// Registers a new user with email and password.
export const register = api<RegisterRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req) => {
    const { email, password } = req;

    if (!email || !password) {
      throw APIError.invalidArgument("email and password are required");
    }

    if (password.length < 8) {
      throw APIError.invalidArgument("password must be at least 8 characters");
    }

    const existingUser = await db.queryRow`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.queryRow<{ id: number; email: string }>`
      INSERT INTO users (email, password_hash)
      VALUES (${email.toLowerCase()}, ${passwordHash})
      RETURNING id, email
    `;

    if (!user) {
      throw APIError.internal("failed to create user");
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

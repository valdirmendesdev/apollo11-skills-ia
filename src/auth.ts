import type { RequestHandler } from "express";
import { jwtVerify } from "jose";
import { Problem } from "./problems.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/** HS256 shared secret used to verify the externally issued JWTs. */
export type AuthConfig = { secret: string };

const unauthorized = () => new Problem(401, "/problems/unauthorized", "Missing or invalid bearer token");

/**
 * Verifies the external JWT (HS256) and exposes its `sub` as the User id.
 * Token expiry is checked against wall-clock time, not the injected domain clock:
 * it's an auth concern, not a business rule.
 */
export function requireAuth(config: AuthConfig): RequestHandler {
  const key = new TextEncoder().encode(config.secret);
  return async (req, _res, next) => {
    const token = /^Bearer (\S+)$/.exec(req.get("authorization") ?? "")?.[1];
    if (!token) throw unauthorized();

    let sub: string | undefined;
    try {
      ({ payload: { sub } } = await jwtVerify(token, key, { algorithms: ["HS256"] }));
    } catch {
      throw unauthorized();
    }
    if (!sub) throw unauthorized();

    req.userId = sub;
    next();
  };
}

export function userIdOf(req: Express.Request): string {
  if (!req.userId) throw new Error("requireAuth middleware not applied");
  return req.userId;
}

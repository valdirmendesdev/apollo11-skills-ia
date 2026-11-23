import { Router } from "express";
import type pg from "pg";
import { z } from "zod";
import { type AuthConfig, requireAuth, userIdOf } from "../auth.js";
import type { Clock } from "../clock.js";
import { notFound } from "../problems.js";
import { normalizeCity } from "./city.js";

const ProfileBody = z.object({
  displayName: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  contact: z.string().trim().min(1).max(200),
});

type UserRow = { id: string; display_name: string; city: string; contact: string };

function toProfile(row: UserRow) {
  return { id: row.id, displayName: row.display_name, city: row.city, contact: row.contact };
}

export function usersRouter(deps: { primary: pg.Pool; clock: Clock; auth: AuthConfig }) {
  const router = Router();
  router.use("/me", requireAuth(deps.auth));

  router.put("/me", async (req, res) => {
    const body = ProfileBody.parse(req.body);
    const now = deps.clock.now();
    const { rows } = await deps.primary.query<UserRow>(
      `INSERT INTO users (id, display_name, city, city_normalized, contact, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       ON CONFLICT (id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         city = EXCLUDED.city,
         city_normalized = EXCLUDED.city_normalized,
         contact = EXCLUDED.contact,
         updated_at = EXCLUDED.updated_at
       RETURNING id, display_name, city, contact`,
      [userIdOf(req), body.displayName, body.city, normalizeCity(body.city), body.contact, now],
    );
    res.json(toProfile(rows[0]!));
  });

  router.get("/me", async (req, res) => {
    const { rows } = await deps.primary.query<UserRow>(
      "SELECT id, display_name, city, contact FROM users WHERE id = $1",
      [userIdOf(req)],
    );
    const row = rows[0];
    if (!row) throw notFound("profile-not-found", "Profile not found; create it with PUT /me");
    res.json(toProfile(row));
  });

  return router;
}

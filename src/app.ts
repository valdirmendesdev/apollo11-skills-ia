import express from "express";
import type pg from "pg";
import type { AuthConfig } from "./auth.js";
import type { Clock } from "./clock.js";
import { problemHandler, routeNotFound } from "./problems.js";
import { usersRouter } from "./users/routes.js";

export type AppDeps = {
  primary: pg.Pool;
  read: pg.Pool;
  clock: Clock;
  auth: AuthConfig;
};

export function createApp(deps: AppDeps) {
  const app = express();
  app.use(express.json());
  app.use(usersRouter(deps));
  app.use(routeNotFound);
  app.use(problemHandler);
  return app;
}

import express, { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import type pg from "pg";
import { chargesRouter } from "./routes/charges.js";
import { ordersRouter } from "./routes/orders.js";

export function createApp(pool: pg.Pool) {
  const app = express();
  app.use(express.json());
  app.use(chargesRouter(pool));
  app.use(ordersRouter(pool));
  app.use(errorHandler);
  return app;
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "invalid request body", issues: err.issues });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "internal error" });
};

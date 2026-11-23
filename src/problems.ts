import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

/** An error that maps to an RFC 9457 `application/problem+json` response. */
export class Problem extends Error {
  constructor(
    readonly status: number,
    readonly type: string,
    readonly title: string,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(title);
  }
}

export const notFound = (type: string, title: string) => new Problem(404, `/problems/${type}`, title);

export const problemHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const problem = toProblem(err);
  res
    .status(problem.status)
    .type("application/problem+json")
    .json({ type: problem.type, title: problem.title, status: problem.status, ...problem.extra });
};

export const routeNotFound: RequestHandler = (_req, _res, next) => {
  next(notFound("route-not-found", "Route not found"));
};

function toProblem(err: unknown): Problem {
  if (err instanceof Problem) return err;
  if (err instanceof ZodError) {
    return new Problem(400, "/problems/validation", "Request validation failed", {
      errors: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }
  if (isBodyParserError(err)) {
    return new Problem(400, "/problems/malformed-body", "Request body is not valid JSON");
  }
  return internalError(err);
}

function isBodyParserError(err: unknown) {
  return typeof err === "object" && err !== null && "type" in err && err.type === "entity.parse.failed";
}

function internalError(err: unknown) {
  console.error(err);
  return new Problem(500, "/problems/internal-error", "Internal server error");
}

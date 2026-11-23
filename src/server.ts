import { createApp } from "./app.js";
import { systemClock } from "./clock.js";
import { createPool, DEFAULT_DATABASE_URL } from "./db.js";

const port = Number(process.env.PORT ?? 3000);
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error("JWT_SECRET is required");
  process.exit(1);
}

const primaryUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
const primary = createPool(primaryUrl);
const read = createPool(process.env.READ_DATABASE_URL ?? primaryUrl);

const app = createApp({ primary, read, clock: systemClock, auth: { secret: jwtSecret } });

app.listen(port, () => {
  console.log(`apollo11-ia listening on http://localhost:${port}`);
});

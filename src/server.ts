import { createApp } from "./app.js";
import { createPool } from "./db.js";

const port = Number(process.env.PORT ?? 3000);
const pool = createPool();

createApp(pool).listen(port, () => {
  console.log(`apollo11-ia listening on http://localhost:${port}`);
});

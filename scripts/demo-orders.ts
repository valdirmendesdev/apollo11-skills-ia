import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";
import { createPool } from "../src/db.js";

const customerId = Number(process.argv[2] ?? 42);
const pool = createPool();
const server = createApp(pool).listen(0);
const baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;

for (let run = 1; run <= 3; run++) {
  const started = performance.now();
  const res = await fetch(`${baseUrl}/customers/${customerId}/orders`);
  const body = (await res.json()) as { orders: unknown[] };
  const ms = Math.round(performance.now() - started);
  console.log(`run ${run}: ${res.status} | ${body.orders.length} orders | ${ms}ms`);
}

server.close();
await pool.end();

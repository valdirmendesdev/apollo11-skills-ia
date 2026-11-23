import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { createApp } from "../src/app.js";
import { createPool } from "../src/db.js";

const pool = createPool();
const server = createApp(pool).listen(0);
const baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;

const { rows } = await pool.query<{ id: number }>(
  "INSERT INTO customers (name, balance_cents) VALUES ('Demo', 10000) RETURNING id",
);
const customerId = rows[0]!.id;
const idempotencyKey = randomUUID();

console.log(`customer ${customerId}: balance 10000, sending the same charge twice (Idempotency-Key ${idempotencyKey})\n`);

const send = () =>
  fetch(`${baseUrl}/customers/${customerId}/charges`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ amount_cents: 2500, description: "Lunar module fuel" }),
  }).then(async (res) => ({ status: res.status, body: await res.json() }));

const responses = await Promise.all([send(), send()]);
responses.forEach((r, i) => console.log(`request ${i + 1}:`, r.status, JSON.stringify(r.body)));

const after = await pool.query<{ balance_cents: number; charges: string }>(
  `SELECT balance_cents, (SELECT count(*) FROM charges WHERE customer_id = $1) AS charges
   FROM customers WHERE id = $1`,
  [customerId],
);
console.log(`\nfinal balance: ${after.rows[0]!.balance_cents} | charges stored: ${after.rows[0]!.charges}`);

server.close();
await pool.end();

import { createPool, resetData } from "../src/db.js";
import { migrate } from "./migrate.js";

const CUSTOMERS = 2_000;
const PRODUCTS = 500;
const ORDERS = 400_000;
const ITEMS_PER_ORDER = 5;

const pool = createPool();
await migrate(pool);

console.log("resetting data…");
await resetData(pool);

console.log(`seeding ${CUSTOMERS} customers, ${PRODUCTS} products, ${ORDERS} orders…`);
await pool.query(
  `INSERT INTO customers (name, balance_cents)
   SELECT 'Customer ' || g, 100000 FROM generate_series(1, $1) g`,
  [CUSTOMERS],
);
await pool.query(
  `INSERT INTO products (name, price_cents)
   SELECT 'Product ' || g, (random() * 10000)::int + 100 FROM generate_series(1, $1) g`,
  [PRODUCTS],
);
await pool.query(
  `INSERT INTO orders (customer_id, created_at)
   SELECT (random() * ($2 - 1))::int + 1, now() - (random() * interval '365 days')
   FROM generate_series(1, $1)`,
  [ORDERS, CUSTOMERS],
);
await pool.query(
  `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents)
   SELECT o, (random() * ($2 - 1))::int + 1, (random() * 4)::int + 1, (random() * 10000)::int + 100
   FROM generate_series(1, $1) o, generate_series(1, $3)`,
  [ORDERS, PRODUCTS, ITEMS_PER_ORDER],
);
await pool.query("ANALYZE");

await pool.end();
console.log("done");

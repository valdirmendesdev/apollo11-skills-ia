import request from "supertest";
import { describe, expect, it } from "vitest";
import { setupTestApp } from "./helpers.js";

const { app, pool } = setupTestApp();

describe("GET /customers/:id/orders", () => {
  it("lists the customer's orders, newest first, with items and totals", async () => {
    await pool.query(`
      INSERT INTO customers (name) VALUES ('Buzz'), ('Michael');
      INSERT INTO products (name, price_cents) VALUES ('Space suit', 50000), ('Freeze-dried food', 1200);
      INSERT INTO orders (customer_id, created_at) VALUES
        (1, '2026-07-16T13:32:00Z'),
        (1, '2026-07-20T20:17:00Z'),
        (2, '2026-07-21T17:54:00Z');
      INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents) VALUES
        (1, 1, 1, 50000),
        (1, 2, 3, 1200),
        (2, 2, 10, 1100),
        (3, 1, 2, 50000);
    `);

    const res = await request(app).get("/customers/1/orders");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      customer_id: 1,
      orders: [
        {
          id: 2,
          status: "placed",
          created_at: "2026-07-20T20:17:00.000Z",
          items: [{ product_id: 2, product_name: "Freeze-dried food", quantity: 10, unit_price_cents: 1100 }],
          total_cents: 11000,
        },
        {
          id: 1,
          status: "placed",
          created_at: "2026-07-16T13:32:00.000Z",
          items: [
            { product_id: 1, product_name: "Space suit", quantity: 1, unit_price_cents: 50000 },
            { product_id: 2, product_name: "Freeze-dried food", quantity: 3, unit_price_cents: 1200 },
          ],
          total_cents: 53600,
        },
      ],
      lifetime_spent_cents: 64600,
    });
  });
});

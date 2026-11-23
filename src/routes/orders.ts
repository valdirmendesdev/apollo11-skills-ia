import { Router } from "express";
import type pg from "pg";

type OrderRow = { id: number; status: string; created_at: Date };
type ItemRow = { product_id: number; product_name: string; quantity: number; unit_price_cents: number };

async function findOrders(pool: pg.Pool, customerId: number) {
  const { rows } = await pool.query<OrderRow>(
    "SELECT id, status, created_at FROM orders WHERE customer_id = $1 ORDER BY created_at DESC",
    [customerId],
  );
  return rows;
}

async function findItems(pool: pg.Pool, orderId: number) {
  const { rows } = await pool.query<ItemRow>(
    `SELECT oi.product_id, p.name AS product_name, oi.quantity, oi.unit_price_cents
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1
     ORDER BY oi.id`,
    [orderId],
  );
  return rows;
}

export function ordersRouter(pool: pg.Pool) {
  const router = Router();

  router.get("/customers/:id/orders", async (req, res) => {
    const customerId = Number(req.params.id);
    const orders = await findOrders(pool, customerId);

    const detailed = [];
    for (const order of orders) {
      const items = await findItems(pool, order.id);
      const total_cents = items.reduce((sum, i) => sum + i.quantity * i.unit_price_cents, 0);
      detailed.push({ ...order, items, total_cents });
    }

    res.json({
      customer_id: customerId,
      orders: detailed,
      lifetime_spent_cents: detailed.reduce((sum, o) => sum + o.total_cents, 0),
    });
  });

  return router;
}

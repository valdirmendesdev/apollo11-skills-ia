import { Router } from "express";
import type pg from "pg";
import { z } from "zod";
import { idempotent } from "../idempotency.js";
import { assessRisk } from "../risk.js";

const ChargeInput = z.object({
  amount_cents: z.number().int().positive(),
  description: z.string().max(200).optional(),
});

export function chargesRouter(pool: pg.Pool) {
  const router = Router();

  router.post("/customers/:id/charges", idempotent(pool), async (req, res) => {
    const customerId = Number(req.params.id);
    const input = ChargeInput.parse(req.body);

    const risk = await assessRisk({ customerId, amountCents: input.amount_cents });
    if (!risk.approved) {
      res.status(422).json({ error: "charge declined by risk analysis" });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const debit = await client.query<{ balance_cents: number }>(
        `UPDATE customers SET balance_cents = balance_cents - $2
         WHERE id = $1 AND balance_cents >= $2
         RETURNING balance_cents`,
        [customerId, input.amount_cents],
      );
      if (debit.rowCount === 0) {
        await client.query("ROLLBACK");
        res.status(402).json({ error: "insufficient balance or unknown customer" });
        return;
      }
      const { rows } = await client.query<{ id: number; created_at: Date }>(
        "INSERT INTO charges (customer_id, amount_cents, description) VALUES ($1, $2, $3) RETURNING id, created_at",
        [customerId, input.amount_cents, input.description ?? null],
      );
      await client.query("COMMIT");

      res.status(201).json({
        id: rows[0]!.id,
        customer_id: customerId,
        amount_cents: input.amount_cents,
        balance_after_cents: debit.rows[0]!.balance_cents,
        created_at: rows[0]!.created_at,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  return router;
}

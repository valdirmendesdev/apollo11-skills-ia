import request from "supertest";
import { describe, expect, it } from "vitest";
import { setupTestApp } from "./helpers.js";

const { app, pool } = setupTestApp();

async function givenCustomerWithBalance(balanceCents: number) {
  const { rows } = await pool.query<{ id: number }>(
    "INSERT INTO customers (name, balance_cents) VALUES ('Neil', $1) RETURNING id",
    [balanceCents],
  );
  return rows[0]!.id;
}

function charge(customerId: number, amountCents: number, idempotencyKey: string) {
  return request(app)
    .post(`/customers/${customerId}/charges`)
    .set("Idempotency-Key", idempotencyKey)
    .send({ amount_cents: amountCents, description: "Lunar module fuel" });
}

describe("POST /customers/:id/charges", () => {
  it("debits the amount from the customer's balance", async () => {
    const customerId = await givenCustomerWithBalance(10_000);

    const res = await charge(customerId, 2_500, "key-1");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ customer_id: customerId, amount_cents: 2_500, balance_after_cents: 7_500 });
  });

  it("replays the original response when retried with the same Idempotency-Key", async () => {
    const customerId = await givenCustomerWithBalance(10_000);

    const first = await charge(customerId, 2_500, "retry-key");
    const retry = await charge(customerId, 2_500, "retry-key");
    const next = await charge(customerId, 1_000, "another-key");

    expect(retry.status).toBe(201);
    expect(retry.body).toEqual(first.body);
    expect(next.body.balance_after_cents).toBe(6_500);
  });

  it("refuses a charge larger than the available balance", async () => {
    const customerId = await givenCustomerWithBalance(1_000);

    const res = await charge(customerId, 5_000, "too-much");

    expect(res.status).toBe(402);
  });

  it("does not replay another customer's charge when they reuse an Idempotency-Key", async () => {
    const neil = await givenCustomerWithBalance(10_000);
    const buzz = await givenCustomerWithBalance(10_000);

    await charge(neil, 2_500, "shared-key");
    const res = await charge(buzz, 1_000, "shared-key");

    expect(res.body).toMatchObject({ customer_id: buzz, balance_after_cents: 9_000 });
  });

  it("rejects a non-numeric customer id", async () => {
    const res = await charge(Number.NaN, 1_000, "bad-id");

    expect(res.status).toBe(400);
  });
});

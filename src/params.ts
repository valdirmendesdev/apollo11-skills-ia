import { z } from "zod";

const CustomerParams = z.object({ id: z.coerce.number().int().positive() });

export function parseCustomerId(params: unknown): number {
  return CustomerParams.parse(params).id;
}

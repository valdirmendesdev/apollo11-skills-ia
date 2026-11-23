export type RiskAssessment = { approved: boolean; score: number };

const RISK_API_LATENCY_MS = Number(process.env.RISK_API_LATENCY_MS ?? 300);

/**
 * Stand-in for the external anti-fraud provider. The real API answers in
 * ~200–400ms, so the stub keeps a comparable latency.
 */
export async function assessRisk(input: { customerId: number; amountCents: number }): Promise<RiskAssessment> {
  await new Promise((resolve) => setTimeout(resolve, RISK_API_LATENCY_MS));
  const score = input.amountCents > 1_000_000 ? 0.9 : 0.1;
  return { approved: score < 0.5, score };
}

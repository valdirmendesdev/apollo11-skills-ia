/** Injectable source of "now" for all domain time logic; never call `Date.now()` directly. */
export type Clock = { now(): Date };

export const systemClock: Clock = { now: () => new Date() };

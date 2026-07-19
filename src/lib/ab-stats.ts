/** Two-proportion z-test for A/B conversion rates. Returns null if underpowered. */
export function conversionSignificance(
  conversionsA: number,
  usersA: number,
  conversionsB: number,
  usersB: number
): { z: number; pValue: number; significant: boolean; liftPct: number } | null {
  if (usersA < 10 || usersB < 10) return null;
  const p1 = conversionsA / usersA;
  const p2 = conversionsB / usersB;
  const pooled = (conversionsA + conversionsB) / (usersA + usersB);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / usersA + 1 / usersB));
  if (!Number.isFinite(se) || se === 0) return null;
  const z = Math.abs(p1 - p2) / se;
  // Normal CDF approximation for two-tailed p-value
  const pValue = 2 * (1 - normalCdf(z));
  const liftPct = p1 === 0 ? (p2 > 0 ? 100 : 0) : ((p2 - p1) / p1) * 100;
  return {
    z: Math.round(z * 100) / 100,
    pValue: Math.round(pValue * 1000) / 1000,
    significant: pValue < 0.05,
    liftPct: Math.round(liftPct * 10) / 10,
  };
}

function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

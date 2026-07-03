// ---------------------------------------------------------------------------
// Money helpers — everything is Tanzanian Shilling (TZS)
// ---------------------------------------------------------------------------
// Money is stored in the database as Decimal(14,2) for exact precision. When
// Prisma returns a Decimal it is an object (decimal.js) that serialises to a
// STRING in JSON. `toNumber()` normalises string | number | Decimal into a JS
// number for display/arithmetic. `formatTZS()` renders a human-friendly amount.
// ---------------------------------------------------------------------------

export type Money = number | string | { toString(): string };

/** Convert a Decimal / string / number into a plain number. */
export function toNumber(value: Money | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

/** Format an amount as TZS, e.g. 1500000 -> "TZS 1,500,000". */
export function formatTZS(value: Money | null | undefined): string {
  const amount = toNumber(value);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `TZS ${formatted}`;
}

/**
 * Recursively convert Decimal values (and Dates) in an object/array into plain
 * JSON-friendly primitives. Handy before returning DB rows that contain money.
 */
export function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      // Prisma Decimal has a toFixed method and stringifies to a number-like string.
      if (v && typeof v === "object" && typeof (v as { toFixed?: unknown }).toFixed === "function") {
        return Number((v as { toString(): string }).toString());
      }
      return v;
    }),
  );
}

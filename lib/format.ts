// Currency + number formatting helpers (Nigerian Naira).

export function formatNaira(value: number | string | undefined): string {
  const n = Number(value) || 0;
  return n.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// "1350000" or "1,350,000.00" typed by a user -> 1350000 (number)
export function parseAmount(input: string | number): number {
  if (typeof input === "number") return input;
  if (!input) return 0;
  const cleaned = String(input).replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

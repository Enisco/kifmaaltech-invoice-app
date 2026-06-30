// Generates an invoice number from a date/time.
// Rule: <first letter of month><day><hour>-<2-digit year>
// Example: June 30, 07:26  ->  J + 30 + 07 + -26  =>  "J3007-26"
//
// Note: this is a cosmetic, "make it look formal" identifier — not a
// guaranteed-unique sequential counter. Two invoices created in the same
// hour will share a number, which is fine for this use case.

const pad2 = (n: number): string => String(n).padStart(2, "0");

export function generateInvoiceNumber(date: Date = new Date()): string {
  const monthLetter = date
    .toLocaleString("en-US", { month: "long" })
    .charAt(0)
    .toUpperCase();
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  const year2 = pad2(date.getFullYear() % 100);
  return `${monthLetter}${day}${hour}-${minute}`;
}

// Converts a number to words in the style of the existing invoices, e.g.
// 5160000 -> "Five million, one hundred and sixty thousand naira only"
// Handles kobo: 1500.50 -> "One thousand, five hundred naira, fifty kobo only"

const ONES: string[] = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS: string[] = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy",
  "eighty", "ninety",
];
const SCALES: string[] = ["", "thousand", "million", "billion", "trillion"];

// Converts a number below 1000 to words (no leading "and").
function chunkToWords(n: number): string {
  let words = "";
  if (n >= 100) {
    words += ONES[Math.floor(n / 100)] + " hundred";
    n %= 100;
    if (n > 0) words += " and ";
  }
  if (n >= 20) {
    words += TENS[Math.floor(n / 10)];
    if (n % 10 > 0) words += "-" + ONES[n % 10];
  } else if (n > 0) {
    words += ONES[n];
  }
  return words;
}

function integerToWords(num: number): string {
  if (num === 0) return "zero";

  // Break the number into 3-digit groups, smallest first.
  const groups: number[] = [];
  let remaining = num;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    const chunk = chunkToWords(groups[i]);
    parts.push(SCALES[i] ? `${chunk} ${SCALES[i]}` : chunk);
  }

  // Join larger groups with commas, matching the existing invoice style.
  return parts.join(", ");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function amountToWords(amount: number | string | unknown): string {
  const value = Math.max(0, Number(amount) || 0);
  const naira = Math.floor(value);
  const kobo = Math.round((value - naira) * 100);

  const nairaWords = integerToWords(naira);
  let result = `${nairaWords} naira`;

  if (kobo > 0) {
    result += `, ${integerToWords(kobo)} kobo`;
  }
  result += " only";

  return capitalize(result);
}

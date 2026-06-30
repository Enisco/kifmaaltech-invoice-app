// Lightweight persistence for recent invoices, using the browser's
// localStorage. Per-device only (no backend) — good enough for an
// internal tool. All access is guarded so it never throws during SSR.

const KEY = "kifmaal.invoices.v1";

export interface InvoiceItem {
  id: number;
  description: string;
  qty: string;
  unitPrice: number;
  unitPriceInput?: string;
  amount: number;
  amountInput?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  title: string;
  customerName: string;
  customerAddress: string;
  items: InvoiceItem[];
}

export interface InvoiceRecord extends InvoiceData {
  savedAt: string;
}

function safeParse(raw: string): InvoiceRecord[] {
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function loadInvoices(): InvoiceRecord[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(KEY) || "[]");
}

export function saveInvoice(invoice: InvoiceData): InvoiceRecord[] {
  if (typeof window === "undefined") return [];
  const all = loadInvoices();
  const record: InvoiceRecord = { ...invoice, savedAt: new Date().toISOString() };
  const next = [record, ...all].slice(0, 50);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function deleteInvoice(savedAt: string): InvoiceRecord[] {
  if (typeof window === "undefined") return [];
  const next = loadInvoices().filter((i) => i.savedAt !== savedAt);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

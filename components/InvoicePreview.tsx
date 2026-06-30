"use client";

import { formatNaira } from "@/lib/format";
import { amountToWords } from "@/lib/numberToWords";
import { SIGNATURE_B64 } from "@/lib/signature";
import type { InvoiceData } from "@/lib/storage";
import { forwardRef } from "react";

interface InvoicePreviewProps {
  data: InvoiceData;
}

// The actual invoice sheet. Forwards a ref so react-to-print can target it.
const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  function InvoicePreview({ data }, ref) {
    const {
      invoiceNumber,
      date,
      title,
      customerName,
      customerAddress,
      items = [],
    } = data;

    const total = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    return (
      <div
        ref={ref}
        className="print-area mx-auto w-full max-w-[820px] bg-panel text-ink shadow-soft"
      >
        {/* Header band with solar grid */}
        <header className="relative overflow-hidden bg-forest px-8 py-3 text-white">
          <div
            className="panel-grid absolute inset-0 opacity-50"
            aria-hidden={true}
          />
          <div className="relative flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <Sun />
                <span className="font-display text-xl font-700 tracking-tight">
                  KifmaalTech Limited
                </span>
              </div>
              <p className="mt-1 max-w-xs text-[12px] leading-snug text-white/75">
                Solar System / Energy Solutions &amp; Information Technology
              </p>
              <p className="mt-3 text-[11px] leading-relaxed text-white/65">
                kifmaaltech@gmail.com · (+234) 703 847 3215
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="font-display text-2xl font-700 tracking-[0.2em] text-solar">
                INVOICE
              </p>
              <dl className="mt-3 space-y-1 text-[12px]">
                <div className="flex items-center justify-end gap-3">
                  <dt className="text-white/60">No.</dt>
                  <dd className="tnum font-mono font-500 text-white">
                    {invoiceNumber || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <dt className="text-white/60">Date</dt>
                  <dd className="tnum font-mono text-white/90">
                    {date || "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </header>

        <div className="px-8 py-4">
          {/* Bill-to + subject */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <section>
              <p className="text-[10px] font-600 uppercase tracking-[0.18em] text-muted">
                Billed to
              </p>
              <p className="mt-1.5 font-600 text-ink">
                {customerName || "Customer name"}
              </p>
              <p className="mt-0.5 whitespace-pre-line text-[13px] leading-relaxed text-muted">
                {customerAddress || "Customer address"}
              </p>
            </section>

            <section className="sm:text-right">
              <p className="text-[10px] font-600 uppercase tracking-[0.18em] text-muted">
                For
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink">
                {title || "Project / job description"}
              </p>
            </section>
          </div>

          {/* Line items */}
          <table className="mt-7 w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b-2 border-forest text-[10px] uppercase tracking-[0.14em] text-muted">
                <th className="py-2 text-left font-600">Description</th>
                <th className="w-12 py-2 text-center font-600">Qty</th>
                <th className="w-32 py-2 text-right font-600">
                  Unit Price (₦)
                </th>
                <th className="w-36 py-2 text-right font-600">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-muted">
                    No items yet — add a line on the left.
                  </td>
                </tr>
              )}
              {items.map((it, i) => (
                <tr key={it.id ?? i} className="border-b border-line">
                  <td className="py-2.5 pr-3 align-top text-ink">
                    {it.description || (
                      <span className="text-muted">Untitled item</span>
                    )}
                  </td>
                  <td className="tnum py-2.5 text-center align-top text-muted">
                    {it.qty || ""}
                  </td>
                  <td className="tnum py-2.5 text-right align-top font-mono font-500 text-ink">
                    {it.unitPrice ? formatNaira(it.unitPrice) : "—"}
                  </td>
                  <td className="tnum py-2.5 text-right align-top font-mono font-500 text-ink">
                    {formatNaira(it.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="mt-5 flex justify-end">
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between rounded-lg bg-forest px-4 py-3 text-white">
                <span className="text-[11px] font-600 uppercase tracking-[0.16em] text-solar">
                  Total
                </span>
                <span className="tnum font-mono text-lg font-600">
                  ₦{formatNaira(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-[10px] font-600 uppercase tracking-[0.18em] text-muted">
              Amount in words
            </p>
            <p className="mt-1 text-[13px] italic text-ink">
              {amountToWords(total)}
            </p>
          </div>

          <footer className="mt-8 flex items-end justify-between border-t border-line pt-4">
            <p className="text-[11px] leading-relaxed text-muted">
              Thank you for your patronage.
            </p>
            <div className="text-right">
              <img
                src={SIGNATURE_B64}
                alt="Authorized signature"
                className="mb-1 h-16 w-44 object-contain translate-x-8"
              />
              <p className="text-[11px] text-muted">Authorized signature</p>
            </div>
          </footer>
        </div>
      </div>
    );
  },
);

function Sun() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={true}
    >
      <circle cx="12" cy="12" r="4.5" fill="#F5A524" />
      {[...Array(8)].map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line
            key={i}
            x1={12 + Math.cos(a) * 7}
            y1={12 + Math.sin(a) * 7}
            x2={12 + Math.cos(a) * 9.5}
            y2={12 + Math.sin(a) * 9.5}
            stroke="#F5A524"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export default InvoicePreview;

"use client";

import { formatNaira } from "@/lib/format";
import type { InvoiceData } from "@/lib/storage";

type ItemField = "description" | "qty" | "unitPrice";
type StringInvoiceField = Exclude<keyof InvoiceData, "items">;

interface InvoiceFormProps {
  data: InvoiceData;
  onField: (key: StringInvoiceField, value: string) => void;
  onItemField: (id: number, field: ItemField, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (id: number) => void;
  onMoveItem: (id: number, direction: "up" | "down") => void;
}

export default function InvoiceForm({
  data,
  onField,
  onItemField,
  onAddItem,
  onRemoveItem,
  onMoveItem,
}: InvoiceFormProps) {
  const { title, customerName, customerAddress, items } = data;
  const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

  return (
    <div className="space-y-7">
      {/* Customer */}
      <section>
        <SectionLabel>Customer</SectionLabel>
        <div className="mt-3 space-y-3">
          <Field
            label="Customer name"
            value={customerName}
            onChange={(v) => onField("customerName", v)}
            placeholder="The Managing Director, Orisun Microfinance Bank"
          />
          <div>
            <FieldLabel>Customer address</FieldLabel>
            <textarea
              value={customerAddress}
              onChange={(e) => onField("customerAddress", e.target.value)}
              rows={2}
              placeholder="Ago-Iwoye, Ogun State."
              className="w-full resize-none rounded-lg border border-line bg-panel px-3 py-2.5 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
            />
          </div>
        </div>
      </section>

      {/* Job */}
      <section>
        <SectionLabel>The job</SectionLabel>
        <div className="mt-3">
          <Field
            label="Title / what it's for"
            value={title}
            onChange={(v) => onField("title", v)}
            placeholder="6kVA Installation with 15kW Lithium Battery and 10 Panels"
          />
        </div>
      </section>

      {/* Line items */}
      <section>
        <SectionLabel>Items</SectionLabel>

        <div className="mt-3 space-y-2">
          {items.map((it, idx) => (
            <div
              key={it.id}
              className="rounded-xl border border-line bg-surface/60 p-3"
            >
              {/* Item header: number + reorder + remove */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-700 text-forest">#{idx + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onMoveItem(it.id, "up")}
                    disabled={idx === 0}
                    aria-label="Move item up"
                    className="flex h-6 w-6 items-center justify-center rounded text-sm text-muted transition hover:bg-line disabled:opacity-25"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => onMoveItem(it.id, "down")}
                    disabled={idx === items.length - 1}
                    aria-label="Move item down"
                    className="flex h-6 w-6 items-center justify-center rounded text-sm text-muted transition hover:bg-line disabled:opacity-25"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => onRemoveItem(it.id)}
                    disabled={items.length === 1}
                    aria-label={`Remove item ${idx + 1}`}
                    className="flex h-6 w-6 items-center justify-center rounded text-sm text-muted transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Description — full width */}
              <input
                value={it.description}
                onChange={(e) => onItemField(it.id, "description", e.target.value)}
                placeholder="e.g. 560W Solar Panel"
                className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
              />

              {/* Qty + Unit Price + Amount — second line */}
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div>
                  <FieldLabel>Qty</FieldLabel>
                  <input
                    value={it.qty}
                    onChange={(e) => onItemField(it.id, "qty", e.target.value)}
                    placeholder="—"
                    inputMode="numeric"
                    className="tnum w-full rounded-lg border border-line bg-panel px-2.5 py-2 text-center text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
                  />
                </div>
                <div>
                  <FieldLabel>Unit Price</FieldLabel>
                  <input
                    value={it.unitPriceInput ?? ""}
                    onChange={(e) => onItemField(it.id, "unitPrice", e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="tnum w-full rounded-lg border border-line bg-panel px-2.5 py-2 text-right font-mono text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
                  />
                </div>
                <div>
                  <FieldLabel>Amount</FieldLabel>
                  <div className="tnum w-full rounded-lg border border-line bg-line/40 px-2.5 py-2 text-right font-mono text-sm text-muted">
                    {formatNaira(it.amount)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onAddItem}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-500 text-forest transition hover:border-forest hover:bg-forest/5"
        >
          <span className="text-base leading-none">+</span> Add item
        </button>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-surface px-4 py-3">
          <span className="text-xs font-600 uppercase tracking-wider text-muted">
            Running total
          </span>
          <span className="tnum font-mono text-base font-600 text-ink">
            ₦{formatNaira(total)}
          </span>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-xs font-600 uppercase tracking-[0.16em] text-forest">
      {children}
    </h2>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-[10px] font-600 uppercase tracking-wider text-muted">
      {children}
    </span>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function Field({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
      />
    </label>
  );
}

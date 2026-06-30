"use client";

import InvoiceForm from "@/components/InvoiceForm";
import InvoicePreview from "@/components/InvoicePreview";
import LoginGate, { useAuth } from "@/components/LoginGate";
import { parseAmount } from "@/lib/format";
import { generateInvoiceNumber } from "@/lib/invoiceNumber";
import type { InvoiceData, InvoiceRecord } from "@/lib/storage";
import { deleteInvoice, loadInvoices, saveInvoice } from "@/lib/storage";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

type ItemField = "description" | "qty" | "unitPrice";
type StringInvoiceField = Exclude<keyof InvoiceData, "items">;

let idCounter = 1;
const newItem = () => ({
  id: idCounter++,
  description: "",
  qty: "",
  unitPrice: 0,
  unitPriceInput: "",
  amount: 0,
});

const todayString = () => new Date().toLocaleDateString("en-GB"); // dd/mm/yyyy

// Convert between display format (dd/mm/yyyy) and <input type="date"> format (yyyy-mm-dd)
const toInputDate = (d: string) => {
  const [day, month, year] = d.split("/");
  return year && month && day ? `${year}-${month}-${day}` : "";
};
const fromInputDate = (d: string) => {
  const [year, month, day] = d.split("-");
  return year && month && day ? `${day}/${month}/${year}` : "";
};

export default function Page() {
  const [data, setData] = useState<InvoiceData>({
    invoiceNumber: "",
    date: "",
    title: "",
    customerName: "",
    customerAddress: "",
    items: [newItem()],
  });
  const [recents, setRecents] = useState<InvoiceRecord[]>([]);
  const [showRecents, setShowRecents] = useState(false);
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");
  const [justSaved, setJustSaved] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const invoiceContentRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [invoiceHeight, setInvoiceHeight] = useState(0);

  // Scale preview to fit the container while preserving A4 proportions.
  // Uses transform: scale (not zoom) for reliable cross-browser support.
  // Measures natural content height so the container collapses to the
  // correct scaled height with no dead space.
  useEffect(() => {
    const container = previewContainerRef.current;
    const content = invoiceContentRef.current;
    if (!container) return;
    const update = () => {
      const scale = Math.min(1, container.clientWidth / 820);
      setPreviewScale(scale);
      if (content) setInvoiceHeight(content.offsetHeight * scale);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    if (content) ro.observe(content);
    return () => ro.disconnect();
  }, []);

  // Generate the invoice number + date once on mount (from the live clock).
  useEffect(() => {
    setData((d) => ({
      ...d,
      invoiceNumber: generateInvoiceNumber(),
      date: todayString(),
    }));
    setRecents(loadInvoices());
  }, []);

  // --- field handlers ---
  const onField = (key: StringInvoiceField, value: string) =>
    setData((d) => ({ ...d, [key]: value }));

  const onItemField = (id: number, field: ItemField, value: string) =>
    setData((d) => ({
      ...d,
      items: d.items.map((it) => {
        if (it.id !== id) return it;
        if (field === "unitPrice") {
          const unitPrice = parseAmount(value);
          const effectiveQty =
            it.qty && Number(it.qty) > 0 ? Number(it.qty) : 1;
          return {
            ...it,
            unitPriceInput: value,
            unitPrice,
            amount: effectiveQty * unitPrice,
          };
        }
        if (field === "qty") {
          const effectiveQty = value && Number(value) > 0 ? Number(value) : 1;
          return {
            ...it,
            qty: value,
            amount: effectiveQty * (it.unitPrice ?? 0),
          };
        }
        return { ...it, [field]: value };
      }),
    }));

  const onAddItem = () =>
    setData((d) => ({ ...d, items: [...d.items, newItem()] }));

  const onRemoveItem = (id: number) =>
    setData((d) => ({
      ...d,
      items:
        d.items.length === 1 ? d.items : d.items.filter((it) => it.id !== id),
    }));

  const onMoveItem = (id: number, direction: "up" | "down") =>
    setData((d) => {
      const items = [...d.items];
      const idx = items.findIndex((it) => it.id === id);
      if (direction === "up" && idx > 0) {
        [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
      } else if (direction === "down" && idx < items.length - 1) {
        [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
      }
      return { ...d, items };
    });

  // --- print / pdf ---
  // copyStyles:false skips trying to load the Next.js CSS bundle (which
  // fails cross-origin on mobile dev). pageStyle is self-contained CSS that
  // covers every class used in InvoicePreview, so the PDF always renders
  // correctly regardless of network / dev-server restrictions.
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: data.invoiceNumber || "invoice",
    copyStyles: false,
    pageStyle: String.raw`
      @page { size: A4; margin: 4mm 14mm; }
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-sizing: border-box;
      }
      body {
        margin: 0; padding: 0; background: #fff;
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        color: #0C1A12; -webkit-font-smoothing: antialiased;
      }
      table { border-collapse: collapse; }
      img { display: block; }

      /* Custom non-Tailwind utilities */
      .tnum { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }
      .panel-grid {
        background-image:
          linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px);
        background-size: 22px 14px;
      }
      .print-area { position: static; box-shadow: none; border: none; margin: 0; padding: 0; width: 100%; max-width: 100%; }
      .shadow-soft { box-shadow: none; }

      /* Colours (from tailwind.config.ts) */
      .bg-forest  { background-color: #0B3D2E; }
      .bg-panel   { background-color: #ffffff; }
      .text-white { color: #ffffff; }
      .text-ink   { color: #0C1A12; }
      .text-muted { color: #6E7B72; }
      .text-solar { color: #F5A524; }
      .text-white\/75 { color: rgba(255,255,255,0.75); }
      .text-white\/65 { color: rgba(255,255,255,0.65); }
      .text-white\/60 { color: rgba(255,255,255,0.60); }
      .text-white\/90 { color: rgba(255,255,255,0.90); }
      .border-forest { border-color: #0B3D2E; }
      .border-line   { border-color: #E7E2D6; }

      /* Layout */
      .relative { position: relative; }
      .absolute { position: absolute; }
      .inset-0  { top: 0; right: 0; bottom: 0; left: 0; }
      .overflow-hidden { overflow: hidden; }
      .flex    { display: flex; }
      .grid    { display: grid; }
      .block   { display: block; }
      .items-start  { align-items: flex-start; }
      .items-center { align-items: center; }
      .items-end    { align-items: flex-end; }
      .justify-between { justify-content: space-between; }
      .justify-end     { justify-content: flex-end; }
      .shrink-0 { flex-shrink: 0; }
      .gap-2 { gap: 0.5rem; }
      .gap-3 { gap: 0.75rem; }
      .gap-6 { gap: 1.5rem; }
      .grid-cols-1 { grid-template-columns: 1fr; }
      .grid-cols-2 { grid-template-columns: 1fr 1fr; }
      @media (min-width: 640px) {
        .sm\:grid-cols-2 { grid-template-columns: 1fr 1fr; }
        .sm\:text-right  { text-align: right; }
      }
      .w-full { width: 100%; }
      .w-12   { width: 3rem; }
      .w-32   { width: 8rem; }
      .w-36   { width: 9rem; }
      .w-44   { width: 11rem; }
      .h-16   { height: 4rem; }
      .max-w-xs      { max-width: 20rem; }
      .max-w-\[820px\] { max-width: 820px; }
      .mx-auto { margin-left: auto; margin-right: auto; }
      .space-y-1 > * + * { margin-top: 0.25rem; }

      /* Spacing */
      .px-4  { padding-left: 1rem;    padding-right: 1rem; }
      .px-8  { padding-left: 2rem;    padding-right: 2rem; }
      .py-2  { padding-top: 0.5rem;   padding-bottom: 0.5rem; }
      .py-2\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
      .py-3  { padding-top: 0.75rem;  padding-bottom: 0.75rem; }
      .py-4  { padding-top: 1rem;     padding-bottom: 1rem; }
      .py-6  { padding-top: 1.5rem;   padding-bottom: 1.5rem; }
      .pt-4  { padding-top: 1rem; }
      .pr-3  { padding-right: 0.75rem; }
      .mt-1  { margin-top: 0.25rem; }
      .mt-1\.5 { margin-top: 0.375rem; }
      .mt-0\.5 { margin-top: 0.125rem; }
      .mt-3  { margin-top: 0.75rem; }
      .mt-5  { margin-top: 1.25rem; }
      .mt-7  { margin-top: 1.75rem; }
      .mt-8  { margin-top: 2rem; }
      .mb-1  { margin-bottom: 0.25rem; }

      /* Typography */
      .font-mono { font-family: ui-monospace, 'Cascadia Code', monospace; }
      .text-xl  { font-size: 1.25rem;  line-height: 1.75rem; }
      .text-2xl { font-size: 1.5rem;   line-height: 2rem; }
      .text-lg  { font-size: 1.125rem; line-height: 1.75rem; }
      .text-sm  { font-size: 0.875rem; line-height: 1.25rem; }
      .text-\[13px\] { font-size: 13px; }
      .text-\[12px\] { font-size: 12px; }
      .text-\[11px\] { font-size: 11px; }
      .text-\[10px\] { font-size: 10px; }
      .font-500 { font-weight: 500; }
      .font-600 { font-weight: 600; }
      .font-700 { font-weight: 700; }
      .leading-snug    { line-height: 1.375; }
      .leading-relaxed { line-height: 1.625; }
      .leading-tight   { line-height: 1.25; }
      .tracking-tight       { letter-spacing: -0.025em; }
      .tracking-\[0\.2em\]  { letter-spacing: 0.2em; }
      .tracking-\[0\.18em\] { letter-spacing: 0.18em; }
      .tracking-\[0\.16em\] { letter-spacing: 0.16em; }
      .tracking-\[0\.14em\] { letter-spacing: 0.14em; }
      .uppercase       { text-transform: uppercase; }
      .italic          { font-style: italic; }
      .whitespace-pre-line { white-space: pre-line; }
      .text-left   { text-align: left; }
      .text-right  { text-align: right; }
      .text-center { text-align: center; }

      /* Borders */
      .border-b   { border-bottom-width: 1px; border-bottom-style: solid; }
      .border-b-2 { border-bottom-width: 2px; border-bottom-style: solid; }
      .border-t   { border-top-width: 1px; border-top-style: solid; border-top-color: #E7E2D6; }
      .border-collapse { border-collapse: collapse; }
      .rounded-lg { border-radius: 0.5rem; }

      /* Misc */
      .opacity-50  { opacity: 0.5; }
      .align-top   { vertical-align: top; }
      .object-contain { object-fit: contain; }
      .translate-x-8  { transform: translateX(2rem); }
    `,
  });

  // --- save / load ---
  const handleSave = () => {
    const next = saveInvoice(data);
    setRecents(next);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  };

  const handleNew = () => {
    idCounter = 1;
    setData({
      invoiceNumber: generateInvoiceNumber(),
      date: todayString(),
      title: "",
      customerName: "",
      customerAddress: "",
      items: [newItem()],
    });
    setShowRecents(false);
  };

  const handleLoad = (record: InvoiceRecord) => {
    // Re-hydrate unitPriceInput so the form inputs show the saved values.
    const items = (record.items || []).map((it) => ({
      ...it,
      id: idCounter++,
      unitPrice: it.unitPrice ?? 0,
      unitPriceInput:
        it.unitPriceInput ?? (it.unitPrice ? String(it.unitPrice) : ""),
    }));
    setData({ ...record, items: items.length ? items : [newItem()] });
    setShowRecents(false);
    setMobileView("preview");
  };

  const handleDelete = (savedAt: string) => setRecents(deleteInvoice(savedAt));

  const itemCount = useMemo(
    () => data.items.filter((i) => i.description || i.amount).length,
    [data.items],
  );
  void itemCount;

  return (
    <LoginGate>
      <div className="min-h-screen bg-surface">
        {/* Top bar */}
        <header className="no-print sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3">
            <div className="flex items-center gap-2.5">
              <Sun />
              <div className="leading-tight">
                <p className="font-display text-sm font-700 tracking-tight text-ink">
                  KifmaalTech
                </p>
                <p className="text-[11px] text-muted">Invoice generator</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRecents((s) => !s)}
                className="rounded-lg border border-line bg-panel px-3 py-2 text-xs font-500 text-ink transition hover:border-forest"
              >
                Recent {recents.length > 0 && `(${recents.length})`}
              </button>
              <button
                onClick={handleNew}
                className="rounded-lg border border-line bg-panel px-3 py-2 text-xs font-500 text-ink transition hover:border-forest"
              >
                New
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg border border-line bg-panel px-3 py-2 text-xs font-500 text-ink transition hover:border-forest"
              >
                {justSaved ? "Saved ✓" : "Save"}
              </button>
              <button
                onClick={handlePrint}
                className="rounded-lg bg-forest px-3.5 py-2 text-xs font-600 text-white transition hover:bg-forest2"
              >
                Download PDF
              </button>
              <SignOutButton />
            </div>
          </div>

          {/* Mobile view toggle */}
          <div className="mx-auto flex max-w-[1400px] gap-1 px-5 pb-2 lg:hidden">
            <Toggle
              active={mobileView === "form"}
              onClick={() => setMobileView("form")}
            >
              Edit
            </Toggle>
            <Toggle
              active={mobileView === "preview"}
              onClick={() => setMobileView("preview")}
            >
              Preview
            </Toggle>
          </div>
        </header>

        {/* Recents drawer */}
        {showRecents && (
          <RecentsPanel
            recents={recents}
            onLoad={handleLoad}
            onDelete={handleDelete}
            onClose={() => setShowRecents(false)}
          />
        )}

        {/* Split layout */}
        <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-5 py-6 lg:grid-cols-[minmax(380px,460px)_1fr]">
          {/* Form */}
          <div
            className={`no-print ${
              mobileView === "form" ? "block" : "hidden"
            } lg:block`}
          >
            <div className="rounded-2xl border border-line bg-panel p-5 shadow-soft">
              <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
                <div>
                  <p className="text-[10px] font-600 uppercase tracking-[0.16em] text-muted">
                    Invoice number
                  </p>
                  <p className="tnum font-mono text-lg font-600 text-forest">
                    {data.invoiceNumber || "—"}
                  </p>
                </div>
                <div className="text-right">
                  <label className="text-[10px] font-600 uppercase tracking-[0.16em] text-muted">
                    Date
                  </label>
                  <input
                    type="date"
                    value={toInputDate(data.date)}
                    onChange={(e) => onField("date", fromInputDate(e.target.value))}
                    className="tnum mt-0.5 block cursor-pointer bg-transparent font-mono text-sm text-ink outline-none hover:text-forest"
                  />
                </div>
              </div>

              <InvoiceForm
                data={data}
                onField={onField}
                onItemField={onItemField}
                onAddItem={onAddItem}
                onRemoveItem={onRemoveItem}
                onMoveItem={onMoveItem}
              />
            </div>
          </div>

          {/* Preview */}
          <div
            className={`${
              mobileView === "preview" ? "block" : "hidden"
            } lg:block`}
          >
            <div className="lg:sticky lg:top-28">
              <div className="rounded-xl bg-zinc-100 py-2">
                <div
                  ref={previewContainerRef}
                  style={{
                    height: invoiceHeight || undefined,
                    overflow: "hidden",
                  }}
                >
                  <div
                    ref={invoiceContentRef}
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: "top left",
                      width: "820px",
                    }}
                  >
                    <InvoicePreview ref={printRef} data={data} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </LoginGate>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <button
      onClick={signOut}
      className="rounded-lg border border-line bg-panel px-3 py-2 text-xs font-500 text-muted transition hover:border-forest hover:text-ink"
    >
      Sign out
    </button>
  );
}

interface ToggleProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function Toggle({ active, onClick, children }: ToggleProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-600 transition ${
        active
          ? "bg-forest text-white"
          : "bg-panel text-muted border border-line"
      }`}
    >
      {children}
    </button>
  );
}

interface RecentsPanelProps {
  recents: InvoiceRecord[];
  onLoad: (record: InvoiceRecord) => void;
  onDelete: (savedAt: string) => void;
  onClose: () => void;
}

function RecentsPanel({
  recents,
  onLoad,
  onDelete,
  onClose,
}: RecentsPanelProps) {
  return (
    <div className="no-print mx-auto max-w-[1400px] px-5 pb-2">
      <div className="rounded-2xl border border-line bg-panel p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-600 text-ink">
            Recent invoices
          </h3>
          <button
            onClick={onClose}
            className="text-xs text-muted hover:text-ink"
          >
            Close
          </button>
        </div>
        {recents.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            Nothing saved yet. Hit Save to keep an invoice here.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {recents.map((r) => (
              <li
                key={r.savedAt}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <button onClick={() => onLoad(r)} className="flex-1 text-left">
                  <span className="tnum font-mono text-sm font-500 text-forest">
                    {r.invoiceNumber}
                  </span>
                  <span className="ml-3 text-sm text-ink">
                    {r.customerName || "Unnamed customer"}
                  </span>
                  <span className="ml-2 text-xs text-muted">{r.date}</span>
                </button>
                <button
                  onClick={() => onDelete(r.savedAt)}
                  className="rounded px-2 py-1 text-xs text-muted hover:bg-red-50 hover:text-red-600"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Sun() {
  return (
    <svg
      width="20"
      height="20"
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

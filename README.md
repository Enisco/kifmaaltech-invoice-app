# KifmaalTech — Invoice Generator

An internal Next.js tool for creating invoices. No backend, no database —
everything runs in the browser. A soft login keeps casual users (apprentices)
out; saved invoices live in the browser's localStorage on each device.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000

Build for production / hosting:

```bash
npm run build
npm start
```

## How the invoice number works

Generated live from the system clock in `lib/invoiceNumber.js`:

`<first letter of month><day><hour>-<2-digit year>`

Example: 30 June 2026 at 07:xx → **J3007-26**

It's a cosmetic identifier to make invoices look formal — not a guaranteed-
unique sequence, so two invoices made in the same hour share a number.

## Features

- Live split-screen preview (form left, invoice right) that updates as you type
- Dynamic line items — add/remove rows; **Amount is the line total**, Qty optional
- Auto total + "amount in words" (e.g. "Five million, one hundred and sixty
  thousand naira only")
- Download PDF / Print via the browser's print dialog (choose "Save as PDF")
- Save invoices and reopen them later (per-device, localStorage)

## Customising

- **Company details / logo**: `components/InvoicePreview.js` (header section)
- **Colors & fonts**: `tailwind.config.js` and `app/layout.js`
- **Credentials**: `components/LoginGate.js`
- **Invoice number format**: `lib/invoiceNumber.js`

## If you later want real persistence

The two "no backend" trade-offs are the login (not secure) and saved invoices
(per-device only). If you ever need shared, secure storage — e.g. a real
sequential counter or company-wide invoice history — that's the point to add a
lightweight hosted database. The code is structured so `lib/storage.js` is the
only file that would need to change.

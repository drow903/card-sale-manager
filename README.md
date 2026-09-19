# Card Sale Manager

A local-first Windows desktop app for preparing card-sale listings, matching card images, recording claims and offers, tracking buyer orders, and managing packing and shipping.

## Features

- Imports Excel, CSV, and TSV card lists or adds individual cards manually.
- Formats each card into a copy-ready sale listing.
- Matches local images using year folders, player names, card numbers, seven- or eight-digit purchase-date codes, and duplicate sequence numbers.
- Supports manual image attachment and native drag-out to Facebook.
- Tracks list price, private purchase price/date, claims, accepted offers, buyers, and shipping.
- Supports bulk card deletion, bulk image confirmation, and duplicate-card labels.
- Keeps image lookup and exclusion folders shared across sales.
- Checks GitHub releases when the app opens and, after confirmation, downloads and installs signed release installers automatically.
- Creates verified rolling recovery backups, saves again on close, and refuses to update until current sales are safely backed up.
- Supports exact numeric card positioning in addition to custom drag-and-drop ordering.
- Provides PWE and PMWT shipping options.
- Generates buyer summaries and tracking messages.
- Keeps sale data stored locally on the computer.
- Includes Live Sale Mode, a Facebook claim-comment parser, and an unrecognized-comment review queue.
- Provides sale closing, carryover, health-check, version restore, and undo workflows.
- Tracks private profit and inventory aging information.
- Stores buyer profiles, tags, notes, purchase patterns, and repeat-buyer alerts.
- Includes a Packing Slip Studio with saved branded templates, logos, custom colors and messages, local QR codes, links, card thumbnails, configurable sections, live previews, and letter/half-sheet/4×6/compact layouts.
- Prints filtered buyer slips in one job, exports combined PDFs, tracks successful prints and reprints, and can add a shipping-label page.
- Adds packing search, private and buyer-facing packing notes, prominent order totals, address/payment/packing warnings, and print status in Buyer Orders.
- Supports system, light, dark, high-contrast, high-density, adjustable-font, and reduced-motion display preferences while always printing slips on a clean light background.
- Supports sale presets, quick card editing, keyboard shortcuts, and carrier tracking links.
- Saves automatically and displays the most recent successful save time.

## Import columns

`Year`, `Brand`, `Player`, `Number`, `Flaw(s)`, `Grade`, `Claim Price`, `Purchase Price`, and `Purchase Date`.

Use `MMDDYYYY` for Purchase Date when possible. The purchase fields stay out of copied customer listings.

## Development

Requirements: Node.js and pnpm.

```powershell
pnpm install
pnpm start
```

To create the unpacked Windows application:

```powershell
pnpm exec electron-builder --dir
```

## Privacy

Saved sales and image-folder selections are stored locally and are excluded from this repository.

# Card Sale Manager

A local-first Windows desktop app for preparing card-sale listings, matching card images, recording claims and offers, tracking buyer orders, and managing packing and shipping.

## Features

- Imports Excel, CSV, and TSV card lists or adds individual cards manually.
- Saves reusable import-column presets for spreadsheets whose headings differ from the standard template.
- Opens with a Sale Command Center that prioritizes pending offers, address problems, unpaid orders, missing images, and ready-to-ship work.
- Uses a complete Card Sale Manager identity across the Windows icon, sidebar, light and dark themes, onboarding, walkthrough, Help guide, and default packing-slip design.
- Formats each card into a copy-ready sale listing.
- Matches local images using year folders, player names, card numbers, seven- or eight-digit purchase-date codes, and duplicate sequence numbers.
- Supports manual image attachment and native drag-out to Facebook.
- Adds a dedicated Offers desk after Claims Desk, with list price, private purchase price, offer status, and buyer details in one place.
- Keeps offers out of buyer orders and sales totals until accepted; rejected offers return cards to the open pool.
- Supports accepted, rejected, and countered offers with editable copy-ready counter messages.
- Supports bulk card deletion, bulk image confirmation, and duplicate-card labels.
- Keeps image lookup and exclusion folders shared across sales.
- Checks GitHub releases when the app opens and, after confirmation, downloads and installs signed release installers automatically.
- Creates verified rolling recovery backups, saves again on close, and refuses to update until current sales are safely backed up.
- Creates a rotating daily backup and a separate automatic backup immediately before every approved update.
- Supports exact numeric card positioning in addition to custom drag-and-drop ordering.
- Provides PWE and PMWT shipping options.
- Generates buyer summaries and tracking messages from editable saved templates.
- Keeps sale data stored locally on the computer.
- Includes Live Sale Mode, a Facebook claim-comment parser, and an unrecognized-comment review queue.
- Provides sale closing, carryover, health-check, version restore, and undo workflows.
- Tracks private profit and inventory aging information with sortable profit columns.
- Stores buyer profiles, tags, notes, purchase patterns, and repeat-buyer alerts.
- Remembers buyer aliases and address history, and flags missing, incomplete, or duplicate mailing addresses.
- Generates editable sale-introduction posts from the current sale and saved shipping settings.
- Includes a Packing Slip Studio with saved branded templates, logos, custom colors and messages, local QR codes, links, card thumbnails, configurable sections, live previews, and letter/half-sheet/4×6/compact layouts.
- Prints filtered buyer slips in one job, exports combined PDFs, tracks successful prints and reprints, and can add a shipping-label page.
- Designs and prints editable 4×6 PWE thermal labels in portrait or landscape for one buyer or every PWE order, with saved font, alignment, padding, color, and section controls.
- Adds packing search, private and buyer-facing packing notes, prominent order totals, address/payment/packing warnings, and print status in Buyer Orders.
- Supports system, light, dark, high-contrast, high-density, adjustable-font, and reduced-motion display preferences while always printing slips on a clean light background.
- Supports sale presets, quick card editing, keyboard shortcuts, and carrier tracking links.
- Saves automatically and displays a clear “Changes saved locally” confirmation with the most recent save time.
- Includes a first-run setup wizard, fictional sample sale, screenshot-based guided walkthrough, in-app help, and privacy-safe diagnostic report export.

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

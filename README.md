# Card Sale Manager

A local-first Windows desktop app for preparing card-sale listings, matching card images, recording claims and offers, tracking buyer orders, and managing packing and shipping.

## Features

- Imports Excel, CSV, and TSV card lists.
- Formats each card into a copy-ready sale listing.
- Matches local images using year folders, player names, card numbers, and purchase-date filename codes.
- Supports manual image attachment and native drag-out to Facebook.
- Tracks list price, private purchase price/date, claims, accepted offers, buyers, and shipping.
- Supports bulk card deletion, bulk image confirmation, and duplicate-card labels.
- Keeps image lookup and exclusion folders shared across sales.
- Checks GitHub releases for updates when the app opens.
- Provides PWE and PMWT shipping options.
- Generates buyer summaries and tracking messages.
- Keeps sale data stored locally on the computer.

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

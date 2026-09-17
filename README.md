# Card Sale Manager

A local-first Windows desktop app for preparing card-sale listings, matching card images, recording claims and offers, tracking buyer orders, and managing packing and shipping.

## Features

- Imports Excel, CSV, and TSV card lists.
- Formats each card into a copy-ready sale listing.
- Matches local images using year folders, player names, and card numbers.
- Supports manual image attachment and native drag-out to Facebook.
- Tracks list price, purchase price, accepted offers, buyers, and shipping.
- Provides PWE and PMWT shipping options.
- Generates buyer summaries and tracking messages.
- Keeps sale data stored locally on the computer.

## Import columns

`Year`, `Brand`, `Player`, `Number`, `Flaw(s)`, `Grade`, `Claim Price`, and `Purchase Price`.

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

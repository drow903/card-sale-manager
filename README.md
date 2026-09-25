# Card Sale Manager

A local-first Windows desktop app for preparing card-sale listings, matching card images, recording claims and offers, tracking buyer orders, and managing packing and shipping.

## Features

- Imports Excel, CSV, and TSV card lists or adds individual cards manually.
- Saves reusable import-column presets for spreadsheets whose headings differ from the standard template.
- Opens with a Sale Command Center that prioritizes pending offers, address problems, unpaid orders, missing images, and ready-to-ship work.
- Uses a complete Card Sale Manager identity across the Windows icon, sidebar, light and dark themes, onboarding, walkthrough, Help guide, and default packing-slip design.
- Formats each card into a copy-ready sale listing.
- Matches local images using year folders, player names, card numbers, five- to eight-digit purchase-date codes (including `MMDDYY` such as `091326`), and duplicate sequence numbers.
- Auto-confirms a purchase-date filename match when that date identifies only one copy of the card; duplicate same-date copies still require review.
- Re-runs lookup for one card together with every card that shared its suggested image, or deliberately rechecks confirmed images across every current and past sale.
- Enforces one image file per listing across the entire saved workspace, not only the active sale.
- Supports manual image attachment and native drag-out to Facebook.
- Adds a dedicated Offers desk after Claims Desk, with list price, private purchase price, offer status, and buyer details in one place.
- Keeps offers out of buyer orders and sales totals until accepted; rejected offers return cards to the open pool.
- Supports accepted, rejected, and countered offers with editable copy-ready counter messages.
- Builds multi-card bundle offers from selected listings and proportionally distributes the final accepted or countered total across the cards to the exact cent.
- Retains extra spreadsheet columns as typed custom fields that can be searched, edited, inserted into listing templates, printed on packing slips, and used for sorting or grouping.
- Includes Card Pulling Mode with buyer filtering, pull progress, printable pull sheets, and multi-level sorting/grouping by location or any standard or imported custom field.
- Keeps listing references sequential after deletion, sorting, or reordering while permanent internal IDs preserve claims, offers, images, and history; references can also be frozen after posting starts.
- Adds a notification center for offers, payment, addresses, image problems, pulling, packing, tracking, shipping, profit warnings, and portable-file issues, with direct links, snoozing, and dismissal.
- Adds a Shipping Batch Manager for filtering and grouping orders, combined packing-slip printing, PWE labels, bulk tracking assignment, buyer-message copying, and batch shipment completion.
- Supports bulk card deletion, bulk image confirmation, and duplicate-card labels.
- Keeps image lookup and exclusion folders shared across sales.
- Checks GitHub releases when the app opens and, after confirmation, downloads and installs signed release installers automatically.
- Creates verified rolling recovery backups, saves again on close, and refuses to update until current sales are safely backed up.
- Creates rotating daily backups plus a permanent, non-rotating update archive containing the local workspace and any open portable `.csm` file before every approved update.
- Searches verified backups, daily copies, permanent update archives, and legacy application-data folders before ever treating an installation as a first run.
- Supports exact numeric card positioning in addition to custom drag-and-drop ordering.
- Provides PWE and PMWT shipping options.
- Generates buyer summaries and tracking messages from editable saved templates.
- Keeps sale data stored locally on the computer.
- Saves and opens portable `.csm` workspace files from OneDrive or another synced folder while retaining the normal local recovery copy.
- Detects newer cloud copies and active-file locks, creates verified portable-file backups, and opens potentially conflicting files read-only.
- Relinks moved OneDrive images automatically from relative paths or with a one-time image-folder selection, and can create a portable folder containing the CSM file and its images.
- Reviews unresolved images inside the CSM file screen, where each link can be replaced manually or intentionally left unmatched.
- Restores verified portable-file recovery copies without leaving the app.
- Protects cloud edits with automatic conflict copies and a takeover screen showing the other device, activity time, and revisions.
- Pins, reveals, removes, and clearly marks unavailable entries in the recent CSM file list.
- Includes Live Sale Mode, a Facebook claim-comment parser, and an unrecognized-comment review queue.
- Provides sale closing, carryover, health-check, version restore, and undo workflows.
- Tracks private profit and inventory aging information with sortable profit columns.
- Stores buyer profiles, tags, notes, purchase patterns, and repeat-buyer alerts.
- Keeps buyer profiles until the user explicitly deletes them; updates and startup cleanup never remove profiles automatically.
- Avoids creating permanent buyer profiles for pending offers; profiles begin with an accepted claim or offer, an order, or an intentional manual save.
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

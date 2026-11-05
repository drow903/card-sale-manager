# Card Sale Manager 2.3.1

## Fixes

- Makes the One-Off Orders window fit the available display height and gives the order list and order details independent scrolling, so packing and shipping controls always remain reachable.
- Widens the Reusable Buyer Messages window, gives its list and editor independent scrolling, and prevents placeholder and action-button labels from wrapping across multiple lines.
- Improves both layouts on smaller or shorter displays.

# Card Sale Manager 2.3.0

## Highlights

- Adds independent one-off orders for unrelated customer purchases without creating a full sale.
- Supports unlimited custom line items with quantities, prices, and optional customer-facing images.
- Autosaves one-off drafts and carries them through Unpaid, Paid, Packed, Shipped, and manually Closed stages.
- Includes shipping-rule recommendations with manual override, discounts, tax, credits, payments, tracking, copied messages, packing slips, visual summaries, and 4×6 shipping labels.
- Stores closed one-off orders in a dedicated One-Off Order History inside Archived Sale Records and in the buyer profile, while keeping them out of active sales and profit totals.
- Adds optional PayPal, Venmo, Zelle, Apple Pay, and Cash App QR codes to visual buyer summaries.
- Fixes normal sale closing so a closed sale immediately leaves Active Sales and moves to Archived Sale Records.
- Tightens additional-line-item editing, packing, totals, audit history, and automatic shipping-rule recalculation.
- Reuses a persistent local image-folder index for faster matching across sales and refreshes recent indexes in the background.
- Makes notification actions more explicit and preserves the existing large-sale performance and cross-filter selection behavior.
- Updates the built-in help guide and getting-started documentation.

# Card Sale Manager 2.1.1

## Highlights

- Fixes the owner Facebook companion when Facebook was already open before the extension was installed or reloaded.
- Automatically injects the comment reader when needed and shows the exact last capture result or error inside the extension popup.
- Validates the stored pairing token instead of reporting a stale connection as healthy.
- Ties captured Facebook replies to the sale-listing comment they were posted beneath, using Facebook's parent-comment identity when available.
- Matches the detected listing to one unique CSM card and clearly requires manual card selection when the Facebook context is missing or ambiguous.
- Rebuilds automatic image matching around clear eligibility rules instead of percentage scores.
- Treats the expected year folder as a hard boundary before checking player or team, card number, purchase date, year, and brand. Same-name files in other year folders cannot create a conflict.
- Falls back to Football, Basketball, or Hockey folders only when the card has that sport set and no valid match exists in its year folder.
- Recognizes NFL, NBA, NHL, editable sport-folder aliases, and matching two-digit year folders while ignoring broad year-range folder names.
- Keeps weak surname-only sport fallbacks in review until a stronger filename clue supports them.
- Rescans image folders on every lookup and revalidates files before attachment so renamed, moved, deleted, unreadable, or cloud-only images cannot be silently linked.
- Adds a pre-lookup coverage report for required year folders, available sport fallbacks, and cards missing Sport.
- Adds Football, Basketball, and Hockey quick-fix buttons in Image Review that save Sport and immediately retry the affected card.
- Fingerprints image contents so identical renamed copies cannot be attached to multiple listings within the same sale.
- Changes the full image recheck to the active sale only; prior, closed, and archived sales are no longer reconsidered.
- Hard-rejects conflicting purchase dates, keeps identical duplicates together for review, recognizes common duplicate and front/back filename markers, and never assigns one physical file twice within a sale.
- Makes re-runs transactional: existing links stay in place until the seller approves a proposed replacement.
- Adds clearer match statuses, rejected-file reasons, current-versus-proposed filenames, and corrected Confirm match / Confirm no image wording.
- Cleans up the Sale Workspace action bar and moves less-used tools into Additional actions.
- Adds optional subtotal, shipping, final-total, and payment-status lines to visual buyer order cards.
- Updates the built-in help guide for the new 2.1 workflows.


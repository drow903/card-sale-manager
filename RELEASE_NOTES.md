# Card Sale Manager 2.4.1

## Improvements

- Keeps the selected-message copy action visible at the top of the Reusable Buyer Messages window, even while editing or scrolling through a long message.
- Reworks the buyer-message and message-template windows to fit common laptop displays without horizontal scrolling.
- Allows unused built-in quick messages to be hidden and restored later.
- Adds bulk status and shipping actions to Buyer Orders.
- Adds workflow counters, clearer empty states, one-click filter clearing, and more useful selection totals throughout the sale workflow.
- Restores the seller's active sale, workspace, buyer, filters, sorting, and scroll position between sessions.
- Adds mouse Back and Forward button navigation while protecting open editors and unsaved dialogs.
- Adds immediate visual confirmation after copying and guards against accidental double-click actions.
- Fixes Live Sale pop-out copying so the listing is copied before the queue advances and success or failure is shown inside the pop-out.
- Improves responsiveness for large sales and adds repeatable usability and performance checks.

# Card Sale Manager 2.4.0

## Highlights

- Adds multi-card manual posting order in Sale Workspace. Selected cards can move together to the top, bottom, one position up or down, or an exact starting position while preserving their relative order.
- Keeps the image Post queue synchronized immediately with dropdown sorting, single-card moves, drag reordering, and multi-card moves.
- Adds direct buyer renaming across active and archived sales, regular orders, one-off orders, and Buyer Profiles while retaining the old name as an alias.
- Routes rename collisions into the existing merge workflow instead of overwriting a buyer.
- Expands buyer merging to active and archived one-off orders and creates a verified local safety backup before merging or renaming.
- Changes portable CSM recovery copies to a configurable rotating system that defaults to one backup every 30 minutes and keeps at most five new rotating copies per file.
- Restricts automatic cleanup to backups positively identified as CSM 2.4 rotating copies. Primary CSM files, manual exports, protected update archives, and older unclassified recovery files are never deleted automatically.
- Updates the built-in user guide and release QA for the new ordering, buyer-management, and backup controls.

# Card Sale Manager 2.3.2

## Improvements

- Adds multi-select assignment in Claims Desk, including Select visible, a shared buyer field, and a single full-price assignment action for all selected cards.
- Queues notifications so rapid actions no longer overwrite messages, while keeping every notification above open modal windows.
- Adds repeat-click protection to One-Off Order item creation and visual buyer-summary generation.
- Adds image-free visual buyer summaries that keep orders of up to 50 cards on one compact page.
- Rebuilds only the active workspace and updates individual claim rows when possible.
- Indexes duplicate cards and buyer orders once per render instead of repeatedly scanning the complete sale.
- Caches searchable card text and gently debounces search fields for smoother typing.
- Defers safety-snapshot completion and full-state saves until the interface is idle without weakening Undo or update protection.
- Skips redundant saves when nothing has changed.
- Adds a repeatable isolated Electron benchmark covering 300-card sales, One-Off Orders, notifications, summaries, repeat-click protection, and bulk claims.
- Refreshes the Message Templates layout and adds breathing room to Buyer Orders.

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


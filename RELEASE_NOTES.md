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

The owner-only catalog and Facebook companion remain unavailable to standard customer licenses.

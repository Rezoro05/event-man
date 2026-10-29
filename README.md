# Rezi’s Event Inventory System

Project requirements, operating guide, and technical handoff · Updated October 29, 2026

[Open the dashboard](https://rezis-event-inventory-dashboard.rezoro.chatgpt.site/)

## 1. Purpose and readiness

Help an event manager see stock at every selling point, identify shortages, dispatch five movers with trolleys, and confirm deliveries without crediting inventory before it arrives.

**Current status: interactive prototype, not yet a production live-Toast inventory system.** The map, inventory calculations, transfer reservations, mover assignment, delivery confirmation, searchable item field, and transfer history are implemented. Data is stored in the current browser. Real Toast integration, shared server-side inventory, and several operational controls remain to be built before relying on this for a live event.

This document separates current behavior from required future work. It describes the source in this repository; publishing is a separate deployment step.

## 2. Event configuration

### New: station artwork and staffing

The four selling points use an open-kitchen station sprite based on the supplied October 28 design reference. Each station is a separate map object; its name and health bar are attached at its top center with a shared 8px gap above the artwork's upper edge. The garden background no longer contains baked-in shops. The central warehouse is retained.

- The five existing movers are now blue **Hands** characters with names above them. Click a Hand, then **Rename Hand** to change its name, or **Transfer** to use the existing stock-transfer workflow.
- Selecting a station shows its **Sales** and **Chef** counts, names, and character cards above the inventory list. The visible crew on each station reflects its assignments.
- Click a person's card to rename them or choose another assigned station. Click **Manage team** for the complete roster, including staff at other stations and Backstock.
- The initial example roster contains one Sales person and one Chef at each selling station, plus five Hands. These are editable placeholders, not confirmed event staffing.
- Staff moves are immediate assignment changes, not physical arrival confirmations or inventory transfers. They update both locations without changing stock. Hands retain the original transfer confirmation rules.
- Names are limited to 30 characters. Stable IDs preserve a Hand's active delivery when renamed. Names are escaped before display.
- Staff data is stored separately in `rezis-staff-v1` in this browser, with same-origin tab updates and browser-lock serialization where available. It is not shared between devices. Stored malformed data is reported rather than silently overwritten.
- The staffing record has `{version: 1, people: [{id, name, role, location}], events: []}`. Roles are `hands`, `sales`, and `chef`. Hands have `location: null`; station staff have one of the five location names. Rename/move events record prior and new assignments and names.

Implementation: `dist/staff-ledger.js` validates and saves the roster; `dist/staff-ui.js` provides editor and roster dialogs; `dist/staff.css` styles the characters and stations. Artwork and generation prompts are documented in [ASSETS.md](ASSETS.md).

| Setting | Value |
| --- | --- |
| Expected guests | 500 |
| Operating hours | 11:00 AM–4:30 PM, 330 minutes |
| Time zone | America/New_York |
| Event date | Must be confirmed; do not infer it from screenshot dates |
| Selling locations | Atrium 1, Atrium VIP, Cherry 1, Cherry 2 |
| Central warehouse | Backstock |
| Transport team | Five movers, each with a trolley |
| Currency | USD |
| Inventory unit | Finished sellable unit only |

Count a sandwich, pretzel, packaged drink, or complete flight as one sellable unit. Do not track ingredients, recipes, keg volumes, or unfinished production in this system. If servings are prepared from bulk stock, define the finished-unit conversion outside this ledger before loading counts.

VIP Flight is a separate finished product, sellable only at Atrium VIP. Backstock may hold it for replenishment. Its components must not also be deducted as separate products unless the inventory model is explicitly redesigned.

The botanical-garden map is a decorative schematic, not a measured floor plan or actual walking-route/GPS map. Confirm the real shop and warehouse positions before event use.

## 3. Main dashboard and map

### Key metrics

The current top row shows:

- Sales revenue: supplied summary revenue when available; otherwise quantity sold × menu price. The fallback is an estimate, not settled Toast revenue.
- Units sold across the four selling locations.
- Available stock at selling locations, after sales and outbound reservations.
- Available Backstock units.
- Refill signals: count of flagged item/location pairs, not unique products or transfer requests.
- Stockouts: item/location pairs at zero or below.
- In transit: units currently assigned to movers; queued requests are not included in this number.

The headline revenue is rounded to whole dollars. The building tooltip displays dollars and cents. Discounts, taxes, refunds, service charges, and comps need a confirmed revenue definition before live reporting.

### Building health bars

- Show the building name and a small segmented game-style health bar above its roof, without a large descriptive card covering the shop. Every bar is bottom-anchored with the same 8px gap from its roof edge, including on hover and selection.
- Keep stock numbers hidden on the map by default.
- Hover or keyboard-focus a building to reveal stock available, units sold, and sales dollars.
- If sales dollars are calculated from menu prices, the tooltip labels them **Est. sales**.
- Escape dismisses the tooltip. On touch screens, the first tap reveals stats and selects the building; the next tap moves to its item inventory.
- Clicking a building selects its product panel.
- Health-bar fill is available units divided by opening units, clamped to 0–100%. Incoming replenishment can make actual stock exceed the original count; the tooltip retains the true number.
- A selling location’s bar turns yellow or red when its items need attention, even if its total fill is high. A small exclamation mark signals an issue.

Current caveat: map warning aggregation covers selling locations, not Backstock. The Backstock detail panel still applies item-level stock coloring. A fuller warehouse-warning policy remains a follow-up.

### Product details

Selecting a location shows categories, item names, available/opening quantities, units sold, and per-item progress bars. The current categories are Mains & snacks, Beer & cider, Refreshments, and VIP flight.

Current images are illustrative category artwork, not verified photos of each branded product. Individual realistic product photos remain a requested enhancement.

### Stock warning thresholds

Let `opening` be the initial item quantity at that location and `available` the current computed quantity. Evaluate these rules in order:

| Condition | Display |
| --- | --- |
| available < 0 | Red — COUNT MISMATCH; reconcile the ledger |
| available = 0 | Red — OUT OF STOCK |
| available ≤ max(2, ceil(opening × 10%)) | Red — NEARLY OUT |
| available ≤ max(4, ceil(opening × 20%)) | Yellow — LOW STOCK |
| Otherwise | Green — HEALTHY |

For an opening count of 18, 1–2 remaining is red, 3–4 is yellow, and 5 or more is green. Negative stock is visible rather than silently changed to zero. Investigate the sales feed, starting counts, and transfers if this happens.

## 4. Inventory and transfer accounting

For each item and location:

```text
Available = Opening inventory
          + Delivered transfers in
          - Outbound transfers reserved, moving, or delivered
          - Units sold
```

A transfer reserves its quantity at the source immediately. It does not become available at the destination until receipt is explicitly confirmed. Assigning a mover does not subtract it a second time.

Example: Backstock has 20 pretzels and Cherry 1 has 3. Initiating a transfer of 10 leaves Backstock with 10 available and Cherry 1 with 3 available. After delivery confirmation, Cherry 1 has 13. No sale occurred and total inventory was conserved.

Across the whole event, available stock plus pending transfer units should equal opening stock minus sold units, in the absence of adjustments. Do not add already-delivered transfers to pending stock.

## 5. Mover workflow and transfer history

### Initiate and dispatch

1. Click an available mover on the map, then **Transfer**, to open **Log a transfer** with that mover selected. Alternatively, use the general transfer-request control to queue an unassigned request.
2. Choose source and destination.
3. Type into the Item field to search by name, brand, or category. The search tolerates case and accents, including `ø`/`o`. Arrow keys, Enter, and Escape work with the choices.
4. Select a valid menu item and enter a positive whole-number quantity.
5. Submit. The system rechecks current source availability and shows a success message when initiated.
6. If queued, assign an available mover. Each mover may have only one active job.
7. The map animates the mover and trolley toward the destination.
8. When the physical products arrive, acknowledge receipt and select **Confirm delivery**. Only then does destination stock increase.

The animation is illustrative and lasts approximately 12 seconds. It is not evidence of physical delivery, live tracking, or an ETA. Reaching the visual destination must never automatically confirm receipt.

### Status meanings

| History label | Meaning | Inventory effect |
| --- | --- | --- |
| Initiated | Request was recorded; a history event | Source is reserved |
| Looking for transporter | Waiting for a free person to move the goods | Source stays reserved; destination unchanged |
| On a task | A mover has been assigned and is transporting the goods | Source stays reserved; destination unchanged |
| Delivered | Receipt was explicitly confirmed | Destination gains the units; mover becomes available |

“Initiated” is a historical event, not a separate long-lived current status. A request created from a free mover can go directly from initiated to on a task. History filters show all transfers or the matching stage/event, with timestamps and the route.

### Validation rules

- Reject zero, negative, fractional, unsafe, or over-available quantities.
- Reject unknown items, invalid locations, and identical source/destination.
- Reject assigning a busy or unknown mover.
- Reject duplicate transfer IDs and repeat delivery confirmations.
- Restrict the exact catalog item `VIP Flight` to Atrium VIP or Backstock as a transfer destination.
- Re-read persisted state before changing stock; use browser locks where supported to reduce same-browser tab races.

Cancellation, partial receipt, damaged goods, substitutions, failed delivery, and reassignment are not currently supported. Do not falsely mark a transfer delivered to clear a problem. These flows need explicit audited inventory rules before production use.

## 6. Starting menu and planning quantities

The following is the current built-in catalog, not a verified complete transcription of the original menu. The supplied menu image was cropped. Confirm all names, serving sizes, prices, availability, and counts against the complete event menu and a physical count.

These are approximate planning quantities for 500 guests, not purchase instructions or actual stock. Multiple food/drink units per guest are expected. Allocations can be revised after the guest mix and service plan are confirmed.

| Item | Price | Atrium 1 | Atrium VIP | Cherry 1 | Cherry 2 | Backstock |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Chicken Schnitzel Sandwich | $13.00 | 30 | 15 | 25 | 25 | 35 |
| Braised Bratwurst | $10.50 | 20 | 10 | 20 | 20 | 20 |
| Hot Dog | $8.50 | 25 | 10 | 25 | 25 | 35 |
| Warm Salted Pretzel VGO | $8.50 | 25 | 10 | 20 | 20 | 35 |
| Harvest Salad VG, AG | $16.00 | 10 | 8 | 10 | 10 | 12 |
| Sweet Pumpkin Loaf VG, AG | $7.50 | 15 | 8 | 15 | 15 | 17 |
| Hal’s Chips & Popcorn VG, AG | $3.50 | 15 | 8 | 15 | 15 | 27 |
| Assorted Snacks | $4.50 | 15 | 8 | 15 | 15 | 27 |
| Talea Al Dente Pilsner 12 oz | $9.50 | 20 | 10 | 20 | 20 | 30 |
| Talea Basically Pumpkin Ale 16 oz | $11.00 | 18 | 10 | 18 | 18 | 26 |
| Grimm Ales Weisse Hefeweissbier 16 oz | $11.00 | 18 | 10 | 18 | 18 | 26 |
| KCBC Zøktoberfest 16 oz | $11.00 | 18 | 10 | 18 | 18 | 26 |
| Hudson North Big Apple Dry Cider 12 oz | $9.50 | 18 | 10 | 18 | 18 | 26 |
| Hudson North Apple Pie Cider 16 oz | $11.00 | 18 | 10 | 18 | 18 | 26 |
| Liquid Fables The Boy Who Cried Wolf Strawberry Mule | $16.50 | 15 | 8 | 15 | 15 | 22 |
| Rain Brand Water 16 oz | $4.50 | 30 | 15 | 30 | 30 | 45 |
| Hal’s Seltzer 12 oz | $4.25 | 20 | 10 | 20 | 20 | 30 |
| Red Jacket Cider 12 oz | $6.00 | 18 | 10 | 18 | 18 | 26 |
| VIP Flight | TBD* | 0 | 45 | 0 | 0 | 0 |
| **Total units** | | **348** | **225** | **338** | **338** | **491** |

Total opening units: **1,740**; at selling locations: **1,249**. These are unit counts, not guest counts or revenue estimates.

*VIP Flight currently has a numeric price of zero in code as a placeholder. Confirm whether it is prepaid, included, or separately sold, and set reporting accordingly. Zero must not be interpreted as a verified free price. Dietary abbreviations are retained as catalog text, not independently validated dietary claims.*

## 7. Toast intake: current state and required integration

There should be no manual **Log a sale** workflow. Sales must originate from Toast or an explicitly labeled test/import feed.

### What exists now

`loadToastMock()` in `dist/app.js` attempts to fetch these relative files from `../../mock-toast-pos/`:

- `event-config.json`: products and starting inventory.
- `toast-webhook-events.json`: normalized mock orders and selections.
- `dashboard-summary.json`: revenue and location summaries.

This is a one-time mock-file load on page initialization, not a live Toast subscription. When files are available it replaces the built-in menu and stored sales with mock data, while retaining transfers. When they are unavailable, the UI reports **Mock feed unavailable** and uses the built-in menu plus existing browser state.

The standard deployed `dist` directory does not contain that sibling mock folder. A successful local mock demonstration therefore does not prove the published Site has a working feed. The sibling mock dataset also uses a different, wine-oriented menu. Do not mix it with the event catalog or existing transfers without reconciling item identities. Its differently named VIP product is not covered by the current exact-name `VIP Flight` rule.

### Required before live service

- Obtain authorized Toast access and confirm the supported event/API/export mechanism with the account’s integration capabilities.
- Keep credentials and webhook verification on a server, never in browser JavaScript or this repository.
- Introduce stable product/SKU IDs, location IDs, and a confirmed Toast revenue-center mapping; names alone are insufficient.
- Normalize sale timestamps, quantities, item identity, location, and line-level sale IDs.
- Deduplicate retries and handle amended orders without double-decrementing inventory.
- Specify the effect of voids, refunds, returns, comps, cancellations, and failed payments on units and revenue. A refund does not necessarily mean a sellable unit returned to stock.
- Reject or quarantine unmapped items/locations and malformed quantities; show actionable errors rather than silently losing sales.
- Store sales and transfers in a shared durable database with atomic inventory reservations.
- Add authenticated manager/mover permissions and an audit trail of who initiated, dispatched, and received goods.
- Show last successful sync, disconnected/stale status, retries, reconciliation differences, and a recovery process.
- Reconcile location revenue and units with Toast before trusting the dashboard totals.

### Proposed normalized intake contract — not yet an implemented importer

```json
{
  "saleId": "unique-order-line-or-event-id",
  "timestamp": "2026-10-28T12:15:00-04:00",
  "itemId": "pretzel",
  "item": "Warm Salted Pretzel VGO",
  "quantity": 2,
  "location": "Cherry 1",
  "revenueCenterId": "confirmed-toast-center-id",
  "netRevenue": 17.00,
  "currency": "USD",
  "eventType": "sale"
}
```

The date and identifiers above are examples, not event configuration. Define monetary semantics and integer-cent storage in the production adapter. A CSV adapter should at minimum support timestamp, item, quantity, revenue center/location, and sale ID, with an explicit mapping preview and validation before import.

## 8. Persistence and existing data formats

The current browser stores `{sales: [], transfers: []}` in localStorage under `rezis-inventory-v1`. The opening menu is in source, not a separate editable database. The revenue summary loaded from mock files is held in memory.

Current sales records use `item`, `location`, and `qty`; mock-loaded records additionally use `at` and `orderId`. An order ID alone is not a robust production line-level deduplication key.

Example current transfer shape:

```json
{
  "id": "unique-transfer-id",
  "item": "Warm Salted Pretzel VGO",
  "from": "Backstock",
  "to": "Cherry 1",
  "qty": 10,
  "at": 1793203200000,
  "moverId": "mover-1",
  "status": "in_transit",
  "assignedAt": 1793203200000,
  "events": [
    {"status": "initiated", "at": 1793203200000},
    {"status": "in_transit", "at": 1793203200000}
  ]
}
```

Transfer times are epoch milliseconds. Internal current statuses are `looking_for_transporter`, `in_transit`, and `delivered`; completed records add `deliveredAt`. Unassigned requests have `moverId: null`. Legacy records without a status are treated as already delivered to preserve previous balances.

### Important limits

- Storage is specific to the browser profile and origin. Localhost ports and the published URL have separate datasets.
- Different staff phones do not share transfers or stock automatically.
- Same-origin tabs can refresh through storage events; browser locks are a local safeguard, not server concurrency control.
- Clearing browser storage, changing profiles, or using private browsing can lose data.
- There is no built-in durable backup, export/import recovery flow, or multi-event partitioning yet.
- Never clear state or switch catalogs during operations without a verified backup and reconciliation plan.

## 9. Additional requested features still needed

### Sales velocity and minutes to stockout

Not implemented in the current dashboard. Proposed behavior:

```text
Velocity = valid units sold during the recent window / observed minutes
Minutes to stockout = available units / velocity
```

Use a configurable rolling window, such as 30 minutes, bounded by actual event elapsed time. Show “Not enough data” for insufficient history or no positive rate, not an invented prediction. Suppress or flag projections when the feed is stale. Preserve item/location granularity and compare time to stockout with event closing time and refill lead time.

### Suggested refill source

Not implemented automatically. Prefer sufficient available Backstock. Otherwise suggest a selling location with lower sales velocity and enough remaining buffer for its own demand. Respect pending reservations and VIP restrictions. A suggestion must not dispatch or reserve stock without an explicit request.

### Original Excel workbook request

No `.xlsx` deliverable is included in this repository. If still required, create these tabs using the same catalog and accounting rules:

1. **Opening Inventory:** item/SKU, category, unit, location, opening quantity, price, and threshold settings.
2. **Live Sales:** timestamp, item/SKU, quantity, revenue center/location, unique sale-line ID, and agreed revenue fields.
3. **Transfers:** ID, timestamp, item/SKU, quantity, source, destination, mover, status, dispatch time, delivery time, and history/audit fields.
4. **Dashboard:** current stock by item/location, sold totals, revenue, conditional warnings, velocity, stockout projection, and suggested refill source.

Do not count every transfer as delivered in the workbook. Match the source-reservation/destination-receipt rules in Section 4. Decide which system is authoritative to avoid divergent spreadsheet and web ledgers.

## 10. Event-day operating checklist

### Before opening

- Confirm event date, time zone, final menu, branded drinks, VIP policy, and prices.
- Physically count finished units at all five locations and approve opening allocations.
- Confirm actual map positions, pickup points, delivery paths, and mover identities.
- Complete the live-feed/server work above; until then, treat this as a demonstration or supervised single-browser prototype.
- Verify Toast item/location mappings, duplicate handling, revenue totals, and sync indicators.
- Test one transfer end to end and verify source reservation, dispatch, receipt, and conservation.
- Establish who may confirm deliveries and how shortages, cancellations, or damaged products are handled.
- Establish backups, reconciliation, device access, and a fallback log if connectivity fails.

### During service

- Watch stockout/refill signals and data freshness, not only the total building bar.
- Open the shop panel to identify the specific low item.
- Check available source stock; create a transfer and assign a free mover.
- Confirm delivery only after the receiving location verifies the actual products and quantity.
- Review waiting requests so stock does not remain unnecessarily reserved.
- Investigate negative stock and feed errors immediately; do not conceal them by editing displayed values.

### At close

- Reconcile unfinished transfers and physically count remaining stock.
- Compare sold units and revenue with Toast using the agreed reporting definition.
- Record waste, returns, discrepancies, and corrections in an approved audit process.
- Preserve the event ledger and reports before preparing a new event.

## 11. Development and maintenance

### Source map

| File | Responsibility |
| --- | --- |
| `dist/index.html` | Page structure, base layout, dialogs, script/style loading |
| `dist/app.js` | Menu, dashboard calculations/rendering, map, mover UI, persistence, mock loader |
| `dist/transfer-ledger.js` | Stock formula, transfer validation, state transitions, thresholds |
| `dist/ui-tools.js` | Searchable item control and history filters/timeline |
| `dist/transfers.css` | Movers, transfer cards, dialogs, messages |
| `dist/ui-refinements.css` | Item warning colors, search/history styling, label refinements |
| `dist/map-health.css` | Compact game-style building labels, health bars, stats tooltips |
| `dist/assets/` | Garden map and illustrative category images |
| `tests/transfers.test.cjs` | Ledger and mocked-DOM regression tests |
| `.openai/hosting.json` | Existing Site identity and static deployment directory |

This is a static HTML/CSS/JavaScript application. There is no required package-install or build step for the current source.

### Run locally

From the repository directory, use an available port:

```sh
python3 -m http.server 4320 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:4320/`. Stop with Ctrl+C. This serves only `dist`; the sibling mock files will not be available under this configuration. Use a dedicated test origin and test dataset rather than changing operational browser state.

### Run regression tests

```sh
node --check dist/app.js
node --check dist/transfer-ledger.js
node --check dist/ui-tools.js
node --test tests/*.test.cjs
```

The suite includes transfer regressions and staffing tests for counts, moves, names, persistence, failed saves, and preserving active delivery assignments. Browser checks are also needed for map layout, keyboard/touch behavior, tooltip positioning, reduced motion, modal focus, and narrow screens. Automated unit tests do not validate a real Toast integration.

### Publishing

The existing Site is owner-private. Preserve its current access unless the owner explicitly changes it. Use the project ID already recorded in `.openai/hosting.json`; do not create a replacement Site for ordinary edits.

Test the exact source, commit and push it through the authorized Sites source workflow, package the configured static output, and deploy that saved source version. Verify deployment success and the published dashboard. Keep tokens and integration secrets out of source, documentation, browser bundles, and archives.

## 12. Acceptance checks and next priorities

### Regression acceptance

- Five buildings and five movers are visible on the map.
- Buildings show names and compact health bars, with no always-visible stock numbers.
- Hover/focus reveals location stock, sold units, and sales dollars; Escape dismisses it.
- Clicking/tapping a shop exposes the correct inventory without hiding the building artwork behind a large card.
- Search finds branded items by partial typed names and supports keyboard selection.
- Low item rows are yellow; nearly empty, empty, and negative rows are red.
- Over-stock transfers and busy-mover assignments are rejected with a readable message.
- Initiation reserves source stock and shows success; destination stays unchanged until receipt.
- History shows initiation, waiting, on-task, and delivered stages accurately.
- Confirmation credits stock exactly once and releases the mover.
- Refresh preserves the local ledger; quantities reconcile before and after transfers.

### Priority order

1. Confirm complete event menu, actual counts, prices, VIP rules, date, and real venue layout.
2. Implement durable shared inventory, audited roles, and atomic server-side transfer operations.
3. Connect and validate real Toast intake, idempotency, corrections, and sync-health reporting.
4. Add cancellation, partial receipt, exception handling, stock adjustments, backups, and event isolation.
5. Add velocity, stockout projections, and conservative refill suggestions.
6. Finish item-specific images, warehouse warnings, device/accessibility testing, and any required Excel/export deliverable.

The visual prototype should not be treated as operationally complete until these data-integrity and event-readiness requirements are resolved.

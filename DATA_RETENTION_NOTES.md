# Data Retention Notes

## Product Positioning

Diligen should be treated as a deal diligence workspace, not a permanent file archive or long-term data room.

The product should keep active deal data available while users are working, but long-term storage of raw files and heavy parsed data should be intentional, limited, and eventually configurable by organization.

## Main Concern

Some tables can grow quickly if they are retained forever, especially:

- `revenue_rows`
- extracted document page text
- parsed financial line items
- temporary AI processing outputs
- import/extraction logs

`revenue_rows` is the clearest risk because one CSV can contain thousands of rows, and one firm may upload many CSVs across many deals.

## Recommended Retention Direction

### Keep While Deal Is Active

For active deals, keep the working data available:

- source documents
- active CIM
- extracted CIM text
- AI analysis
- financial extraction rows
- revenue rows
- call notes
- saved views
- IC memo
- audit metadata

### Preserve Lightweight Work Product

When a user saves or generates work product, keep a lightweight snapshot:

- AI analysis summary
- IC memo
- saved revenue views
- generated view result snapshot
- notes
- key deal metadata
- created by / created at metadata

Saved revenue views should store both:

- the view configuration
- the calculated result snapshot

That way, old raw `revenue_rows` can eventually be purged without breaking saved views.

### Purge Heavy Working Data Later

After a deal is passed, closed, or inactive for a defined period, consider purging:

- raw `revenue_rows`
- extracted page text
- temporary financial extraction rows if snapshots exist
- transient processing logs
- stale intermediate AI outputs

Potential default ranges to evaluate later:

- passed deals: purge heavy parsed data after 30-60 days
- closed deals: purge heavy parsed data after 30-90 days
- inactive deals: purge heavy parsed data after 90 days of no activity

## Source Files

Source files should have a separate lifecycle from parsed database rows.

Possible direction:

- keep source files while the deal is active
- retain files for a configurable period after pass/close
- make clear that Diligen is not the firm's permanent file system
- eventually allow org admins to configure source file retention

## Future Implementation Questions

- What deal statuses should trigger retention countdowns?
- Should reopening a deal cancel a pending purge?
- Should firms be able to export all work product before purge?
- Should source files and parsed rows have separate retention settings?
- Should org admins have custom retention periods by plan?
- What audit metadata must remain after raw data is purged?

## Near-Term Decision

Do not build automated retention yet.

For now, design new tables so retention can be added cleanly later:

- keep `organization_id`, `deal_id`, and source identifiers on heavy tables
- save generated snapshots for user-facing work product
- avoid making saved views depend forever on raw row tables
- keep source file lifecycle separate from parsed row lifecycle

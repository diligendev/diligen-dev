# Revenue Explorer Production Checklist

## Current State

Revenue Explorer now supports a real CSV-based workflow:

- Select a deal.
- Upload a customer-level revenue CSV.
- Confirm required column matches.
- Save normalized rows to Supabase.
- View saved analyses from the deal page.
- Open a same-tab read-only revenue analysis detail page.

The current implementation is a strong prototype foundation, but it is not yet fully production hardened.

## Production Work Needed

### File Support

- Add XLS and XLSX support.
- Let users choose a worksheet when a workbook has multiple sheets.
- Avoid vulnerable Excel parsing packages.
- Preserve original file metadata.

### Import Reliability

- Move large imports to a background job.
- Add progress states for upload, parsing, validation, and saving.
- Add retry/recovery if an import fails midway.
- Prevent duplicate imports from double-clicking or refreshing during save.

### Validation

- Show skipped row count clearly.
- Show invalid rows with reasons.
- Let users download rejected rows.
- Validate date, customer, and revenue columns before save.
- Warn if total revenue looks unusually low or high.

### Stored Summaries

- Save calculated summary metrics to the database:
  - total revenue
  - customer count
  - top customer concentration
  - top 10 concentration
  - date range
  - product/channel availability
- Avoid recalculating every result page from raw rows long term.

### Permissions

- Decide which roles can create revenue analyses.
- Decide which roles can delete or replace analyses.
- Viewers should probably be read-only.
- Owner/admin should manage delete/replace.

### Analysis Management

- Add rename support for saved revenue analyses.
- Add delete support.
- Add replacement/versioning support.
- Track created by / created at / updated by.
- Show import history on the deal page.

### Performance

- Keep indexes on organization_id, deal_id, revenue_file_id, and revenue_date.
- Add pagination or virtualized tables for large customer/period tables.
- Limit detail page row loading or use stored rollups.
- Add database rollup tables if row counts become large.

### Exports

- Export customer concentration table.
- Export period trend table.
- Export product/channel mix.
- Export normalized revenue rows.

### Tests

- Unit test CSV parsing.
- Unit test number/date parsing.
- Test duplicate-column mapping prevention.
- Integration test import route.
- Integration test org isolation/RLS.
- Test large imports over 1,000 rows.

## Priority Order

1. Add validation and rejected-row visibility.
2. Add rename/delete/versioning.
3. Add stored summaries.
4. Add XLS/XLSX support.
5. Add background imports and progress states.
6. Add fuller test coverage.


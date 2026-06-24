# Document Workflow TODO

These are not blockers for the current document workflow commit. They are the next polish/security items to revisit when the product moves closer to real customer use.

## Security And Permissions

- [ ] Add role-based document permissions.
- [ ] Owners/admins can upload, edit, replace, and delete.
- [ ] Members can upload and edit their own documents.
- [ ] Viewers can only view/download.
- [ ] Add audit events for upload, view, edit, replace CIM, delete, and failed access attempts.
- [ ] Add rate limits on upload, signed URL generation, edit, and delete routes.

## File Safety

- [ ] Add malware/virus scanning before documents are marked ready.
- [ ] Add checksum/hash storage to detect duplicate uploads and verify file integrity.
- [ ] Add stricter file validation beyond MIME type.
- [ ] Add configurable file size limits by organization.

## Processing

- [ ] Add background document extraction jobs.
- [ ] Extract text from active CIM PDFs.
- [ ] Store extracted text page-by-page.
- [ ] Add OCR fallback for scanned PDFs.
- [ ] Track extraction status: pending, extracting, extracted, failed.
- [ ] Show extraction errors in the Documents and CIM Analysis tabs.

## Versioning

- [ ] Add document version history for CIM replacements.
- [ ] Show which CIM version produced the latest analysis.
- [ ] Mark analysis outdated when active CIM is newer than latest analysis.
- [ ] Add ability to compare active vs superseded CIM metadata.

## UX Polish

- [ ] Add real upload progress.
- [ ] Add drag-and-drop upload inside the Documents tab modal.
- [ ] Add document search/filter by type/status.
- [ ] Add "Download" separate from "View" if needed.
- [ ] Add document activity feed entries.
- [ ] Add empty-state guidance for first-time document upload.

## Reliability

- [ ] Add retry/cleanup job for partial failures.
- [ ] Ensure storage file cleanup if database insert/update fails.
- [ ] Ensure database cleanup if storage delete fails.
- [ ] Add tests for one-active-CIM rule.
- [ ] Add tests for cross-organization access blocking.


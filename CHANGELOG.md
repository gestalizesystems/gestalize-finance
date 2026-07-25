# Changelog

Record of notable changes to Gestalize Finance. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Current version: 0.1.0.

---

## [0.1.0] — 2026-06-28

First complete release, in production, with the end-to-end billing cycle.

### Added
- Project documentation.
- Optional two-factor authentication (TOTP) at login.
- Company logo in the PDF report header.
- Combined implementation and subscription charge settled in a single payment.
- Reporting by period with PDF export.
- Editable message templates for customer communication.
- Company settings and integration status screen.
- Automated dunning overview.
- Deletion of invoices and expenses.
- Month filter based on real transaction history.
- Responsive interface with navigation adapted for mobile devices.

### Changed
- Standardized application icon and dashboard visual adjustments.
- Visual confirmation when saving settings.

### Fixed
- Billing flow adjustments to ensure correct payment-link generation and due-date
  handling.
- Extended webhook reconciliation to handle payment, overdue, cancellation, and
  refund events.

### Removed
- Unused code and assets, and an unused dependency (cleanup with no behavior
  change).
- Test data from the production environment.

---

## [0.0.2] — 2026-06-27

External integrations and production release.

### Added
- Automatic payment reconciliation via webhook.
- Email integration for sending invoices.
- Messaging integration for sending invoices.
- Private access with authenticated sessions and production readiness.
- Brand identity.

### Changed
- Replaced the messaging provider with a self-hosted solution, reducing
  operational cost.

### Fixed
- Compatibility and session-handling adjustments in the production environment.

---

## [0.0.1] — 2026-06-26

Initial release (MVP) and brand identity.

### Added
- Dashboard, billing engine, and management of clients, products, subscriptions,
  invoices, and expenses.
- Pagination and per-client financial results.

---

## Maintaining this file

For each meaningful set of changes, record an entry under the appropriate section
(Added, Changed, Fixed, or Removed). When publishing a new stable version,
promote the working section to that version with its release date.

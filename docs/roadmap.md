# Bakery Ledger — Development Roadmap

> **Product Manager's Note:** This roadmap outlines the phased delivery of the Bakery Ledger platform, from a single-tenant accounting tool to a multi-tenant SaaS product with notification capabilities. Each phase builds on the last. Phases 1–6 represent the **MVP**, Phase 7 introduces **scale**, and Phases 8–9 prepare for **production and customer engagement**.

---

## Phase 1: Project Setup & Foundation ✅
- [x] Initialize project repository.
- [x] Set up React frontend with Bulma CSS and Solar Icons.
- [x] Configure Firebase (Authentication & Firestore).
- [x] Establish base file structure and routing.

## Phase 2: Core Architecture & Database ✅
- [x] Implement Cents-Only Integer Logic utilities.
- [x] Define and implement Firestore schemas (`accounts`, `journal_entries`).
- [x] Seed initial Chart of Accounts (Generalized).

## Phase 3: Authentication & User Management 🔶
- [x] Develop Admin dashboard for user creation.
- [x] Implement Role-Based Access Control (RBAC) for Admin vs. Staff.
- [x] Build login/logout flow.
- [x] Build admin console for logo, company name, and branding management.

## Phase 4: Transaction Engine (Double-Entry) 🔶
- [x] Implement automated journaling logic (balancing debits/credits).
- [x] Develop payment status tracking (unpaid, partial, paid) for AP/AR.
- [x] **Invoice Referencing**: Payments against credit items reference the original invoice (implemented in `journalService.js`).
- [ ] Create Check Registry for bank reconciliation.
- [x] **Invoice & Receipt Numbering Service**: DB-backed service to track and generate sequential invoice and receipt numbers in Firestore.

## Phase 5: Business Modules 🔶
- [x] Develop Sales Tracker (quick-entry POS for daily sales).
- [x] Develop Invoice & Expense Logger (capturing and categorizing vendor invoices).
- [x] Develop Outstanding Monitor dashboard cards (AR vs. AP).
- [x] Develop Inventory & Waste tracking (items, bundles, inline editing).
- [x] **Enhanced Invoice Logging**: Manual invoice number entry (e.g., from physical books) and custom date selection.
- [x] **Receipt Generation**: Auto-generate printable/digital receipts for POS transactions.

## Phase 6: UI/UX Implementation
- [x] Implement Top Level Bar (Assets vs. Liabilities).
- [x] Apply standardized color coding (Success/Green, Danger/Red, Link/Blue).
- [x] Ensure all action buttons are large and touch-friendly for tablets.

---

## Phase 7: Multi-Tenancy / SaaS Architecture ✅
- [x] Implement site-wide templating system for consistent UI across all modules.
- [x] Implement tenant (business) isolation — each business is its own entity with zero data overlap.
- [x] Scope all Firestore collections under a tenant ID (`tenants/{tenantId}/...`).
- [x] Per-tenant admin and user management.
- [x] Per-tenant branding — logo, company name, and theme configurable via admin console.
- [x] Tenant-aware authentication and context resolution.
- [x] **Super-admin portal** (platform-level):
  - [x] Create new businesses with auto-seeding of default Chart of Accounts.
  - [x] Enable / disable businesses.
  - [x] Provision owner at setup.

## Phase 8: Testing & Deployment 🔲
- [ ] Conduct rigorous testing of accounting logic (no floating-point errors).
- [ ] User acceptance testing with staff.
- [ ] Production deployment and monitoring setup.

## Phase 9: Notification System 🔲
- [ ] Implement email service integration for sending digital receipts and invoices to customers.
- [ ] Customer contact management (email addresses linked to customer records).
- [ ] Email templates for receipts and invoices.

---

## Known Bugs & Issues
- [x] ~~**Incorrect Payment Type**: Payments for credit purchases (AP) are incorrectly logged as "Payment Received".~~ *(Resolved — `payment_sent` type correctly used for AP payments in `journalService.js`)*

---

### Legend
| Symbol | Meaning |
| :---: | :--- |
| ✅ | Phase complete |
| 🔶 | Phase in progress |
| 🔲 | Phase not started |

# Bakery Ledger Development Roadmap

## Phase 1: Project Setup & Foundation
- [x] Initialize project repository.
- [x] Set up React frontend with Bulma CSS and Solar Icons.
- [x] Configure Firebase (Authentication & Firestore).
- [x] Establish base file structure and routing.

## Phase 2: Core Architecture & Database
- [x] Implement Cents-Only Integer Logic utilities.
- [x] Define and implement Firestore schemas (`accounts`, `journal_entries`).
- [x] Seed initial Chart of Accounts (Generalized).

## Phase 3: Authentication & User Management
- [x] Develop Admin dashboard for user creation.
- [x] Implement Role-Based Access Control (RBAC) for Admin vs. Staff.
- [ ] Build admin console for logo, company name, and category management.
- [x] Build login/logout flow.

## Phase 4: Transaction Engine (Double-Entry)
- [x] Implement automated journaling logic (balancing debits/credits).
- [x] Develop payment status tracking (unpaid, partial, paid) for AP/AR.
- [ ] Create Check Registry for bank reconciliation.

## Phase 5: Bakery-Specific (General) Modules
- [x] Develop Sales Tracker (quick-entry for daily sales).
- [x] Develop Bill & Expense Logger (capturing and categorizing invoices).
- [x] Develop Outstanding Monitor dashboard cards.
- [x] Develop Inventory & Waste tracking (with items, bundles, and editing).

## Phase 6: UI/UX Implementation
- [x] Implement Top Level Bar (Assets vs Liabilities).
- [x] Apply standardized color coding (Success/Green, Danger/Red, Link/Blue).
- [x] Ensure all action buttons are large and touch-friendly for tablets.
- [ ] Implement site-wide templating system.

## Phase 7: Multi-Tenancy / SaaS Architecture
- [ ] Implement tenant (business) isolation — each business is its own entity with zero data overlap.
- [ ] Scope all Firestore collections under a tenant ID (e.g., `tenants/{tenantId}/items`, `tenants/{tenantId}/journal_entries`).
- [ ] Per-tenant admin and user management — each business configures its own users and roles independently.
- [ ] Per-tenant branding — logo, company name, and theme configurable through the business admin console.
- [ ] Tenant-aware authentication — users are scoped to their tenant; login routes to the correct tenant context.
- [ ] **Super-admin portal** (platform-level):
  - [ ] Create new businesses — assigns an owner at setup and auto-seeds all defaults (Chart of Accounts, etc.).
  - [ ] Enable / disable businesses — disabled tenants cannot log in or access data.
  - [ ] No external / public sign-ups — only the super-admin can provision new businesses.

## Phase 8: Testing & Deployment
- [ ] Conduct rigorous testing of accounting logic (no floating point errors).
- [ ] User testing with staff.
- [ ] Production deployment.

## Known Bugs & Issues
- [ ] **Incorrect Payment Type**: Payments for credit purchases (AP) are incorrectly logged as "Payment Received".

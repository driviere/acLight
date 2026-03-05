# Bakery Ledger Development Roadmap

## Phase 1: Project Setup & Foundation
- [ ] Initialize project repository.
- [ ] Set up React frontend with Bulma CSS and Solar Icons.
- [ ] Configure Firebase (Authentication & Firestore).
- [ ] Establish base file structure and routing.

## Phase 2: Core Architecture & Database
- [ ] Implement Cents-Only Integer Logic utilities.
- [ ] Define and implement Firestore schemas (`accounts`, `journal_entries`).
- [ ] Seed initial Chart of Accounts.

## Phase 3: Authentication & User Management
- [ ] Develop Admin dashboard for user creation.
- [ ] Implement Role-Based Access Control (RBAC) for Admin vs. Staff.
- [ ] Build login/logout flow.

## Phase 4: Transaction Engine (Double-Entry)
- [ ] Implement automated journaling logic (balancing debits/credits).
- [ ] Develop payment status tracking (unpaid, partial, paid) for AP/AR.
- [ ] Create Check Registry for bank reconciliation.

## Phase 5: Bakery-Specific Modules
- [ ] Develop Sales Tracker (quick-entry for daily sales).
- [ ] Develop Bill & Expense Logger (capturing and categorizing invoices).
- [ ] Develop Outstanding Monitor dashboard cards.
- [ ] Develop Inventory & Waste tracking.

## Phase 6: UI/UX Implementation
- [ ] Implement Top Level Bar (Assets vs Liabilities).
- [ ] Apply standardized color coding (Success/Green, Danger/Red, Link/Blue).
- [ ] Ensure all action buttons are large and touch-friendly for tablets.

## Phase 7: Testing & Deployment
- [ ] Conduct rigorous testing of accounting logic (no floating point errors).
- [ ] User testing with bakery staff.
- [ ] Production deployment.

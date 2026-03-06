# Bakery Ledger — Feature Tracker

> **Product Manager's Note:** This document tracks every discrete feature in the Bakery Ledger application. Features are grouped by functional domain. Each item represents a testable, deliverable unit of work. Use this alongside the [roadmap](./roadmap.md) for planning and progress tracking.

---

## Authentication & User Management
- [x] **Admin-Only Creation**: UI and logic for Admins to add new users via internal dashboard.
- [x] **Staff Role Restrictions**: Staff can only log sales, log waste, and view inventory.
- [x] **Admin Role Permissions**: Admins can manage users, view reports, and manage accounts/items.
- [x] **Admin Console Features**: UI for modifying logo, company name, and managing branding via BrandingManager.

## Transaction Engine (Double-Entry)
- [x] **Automated Journaling**: System auto-creates `journal_entry` documents with balanced Debit/Credit lines for sales.
- [x] **Payment Status Tracking**: Tracks `paid`, `unpaid`, `partial`, and `void` statuses.
- [x] **Void Flow**: Proper voiding mechanism to reverse Journal Entries without deleting records.
- [x] **Invoice Referencing**: Payments against invoices map back via `refNo`.
- [ ] **Check Registry**: Track check numbers and "cleared" status for bank reconciliation.
- [x] **Numbering Service**: Atomic, sequential counters in Firestore for `INV-` and `REC-` generation.

## Business Modules
- [x] **Sales Tracker (POS)**: Quick-entry screen for daily cash and credit sales.
- [x] **Invoice & Expense Logger**: Form to capture vendor invoices with dynamic expense categorization.
- [x] **Outstanding Monitor**: Dashboard cards showing "Total Owed to Us" (AR) vs. "Total We Owe" (AP).
- [x] **Inventory & Waste Tracker**: Manage items and bundles with inline editing. "Burn/Unsold" log for daily waste.
- [ ] **Manual Invoice Entry**: Ability to manually enter invoice numbers (e.g., from physical books) and specify invoice dates.
- [ ] **Receipt Generation**: Generate digital receipts for POS transactions with sequential numbering.

## Core Technical Requirements
- [x] **Money Handling**: Enforce cents-only integer logic across the entire application. No floats.
- [x] **Firestore Schema — Accounts**: `accounts` collection with `id`, `name`, `type`, and `balance`.
- [x] **Firestore Schema — Journal Entries**: `journal_entries` collection with `date`, `type`, `status`, `ref_no`, `total_cents`, `outstanding_cents`, `lines`, and `metadata`.

## UI/UX
- [x] **The Level Bar**: Top-of-screen Assets vs. Liabilities display using Bulma's `.level` component.
- [x] **Color Coding — Income**: `has-text-success` (Green) for Income/Cleared.
- [x] **Color Coding — Expense**: `has-text-danger` (Red) for Expenses/Overdue.
- [x] **Color Coding — Outstanding**: `has-text-link` (Blue) for Outstanding receivables.
- [x] **Action Buttons**: Large, touch-friendly buttons with Solar Icons for tablet POS use.

## Multi-Tenancy / SaaS Architecture ✅
- [x] **Site-Wide Templating**: Consistent UI templates and layout patterns across all modules (supports per-tenant dynamic branding).
- [x] **Data Isolation**: Scope all Firestore transactions under a specific tenant ID.
- [x] **Platform Admin Portal**: Super-admin views for provisioning and managing businesses on the platform.

## Notification System
- [ ] **Email Receipts & Invoices**: Send digital copies of receipts and invoices directly to customers via email.
- [ ] **Customer Contact Management**: Store and manage customer email addresses for notification delivery.
- [ ] **Email Templates**: Configurable templates for receipt and invoice emails.

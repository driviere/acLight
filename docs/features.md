# Bakery Ledger Feature Tracker

## Authentication & User Management
- [x] **Admin-Only Creation**: UI and logic for Admins to add new users via internal dashboard.
- [x] **Staff Role Restrictions**: Staff can only log sales, log waste, and view inventory.
- [x] **Admin Role Permissions**: Admins can manage users, view reports, and manage accounts/items.
- [ ] **Admin Console Features**: UI for modifying logo, company name, and managing item categories.

## Transaction Engine (Double-Entry)
- [x] **Automated Journaling**: System auto-creates `journal_entry` documents with balanced Debit/Credit lines for sales.
- [x] **Payment Status Tracking**: Track unpaid, partial, and paid statuses for Accounts Receivable.
- [x] **Payment Status Tracking**: Track unpaid, partial, and paid statuses for Accounts Payable.
- [ ] **Check Registry**: Track check numbers and "cleared" status for bank reconciliation.

## Bakery-Specific (General) Modules
- [x] **Sales Tracker**: Screen for quick-entry of daily sales (POS).
- [x] **Bill & Expense Logger**: Form to capture vendor invoices and categorize dynamically.
- [x] **Outstanding Monitor**: Dashboard cards showing "Total Owed to Us" vs "Total We Owe".
- [x] **Inventory & Waste Tracker**: Manage items, bundles, and "Burn/Unsold" log. Includes fields for item description, quantity, and price.

## Core Technical Requirements
- [x] **Money Handling**: Enforce cents-only integer logic across the entire application. No floats.
- [x] **Firestore Schema - Accounts**: Implement `accounts` collection containing `id`, `name`, `type`, and `balance`.
- [x] **Firestore Schema - Journal Entries**: Implement `journal_entries` collection containing `date`, `type`, `status`, `ref_no`, `total_cents`, `outstanding_cents`, `lines`, and `metadata`.

## UI/UX
- [x] **The Level Bar**: Top screen display of Assets vs. Liabilities using Bulma's `.level` component.
- [x] **Color Coding**: `has-text-success` (Green) for Income/Cleared.
- [x] **Color Coding**: `has-text-danger` (Red) for Expenses/Overdue.
- [x] **Color Coding**: `has-text-link` (Blue) for Outstanding receivables.
- [x] **Action Buttons**: Large, touch-friendly buttons utilizing Solar Icons for mobile tablet use at the counter.
- [ ] **Site-Wide Templating**: Implement a system for consistent UI templates across all modules.

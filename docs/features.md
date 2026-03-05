# Bakery Ledger Feature Tracker

## Authentication & User Management
- [ ] **Admin-Only Creation**: UI and logic for Admins to add new users via internal dashboard.
- [ ] **Staff Role Restrictions**: Staff can only log sales, log waste, and view inventory.
- [ ] **Admin Role Permissions**: Admins can manage users, view P&L reports, delete/edit ledger entries.

## Transaction Engine (Double-Entry)
- [ ] **Automated Journaling**: System auto-creates `journal_entry` documents with balanced Debit/Credit lines for sales.
- [ ] **Payment Status Tracking**: Track unpaid, partial, and paid statuses for Accounts Receivable.
- [ ] **Payment Status Tracking**: Track unpaid, partial, and paid statuses for Accounts Payable.
- [ ] **Check Registry**: Track check numbers and "cleared" status for bank reconciliation.

## Bakery-Specific Modules
- [ ] **Sales Tracker**: Screen for quick-entry of daily bread and pastry sales.
- [ ] **Bill & Expense Logger**: Form to capture vendor invoices and categorize (Ingredients, Rent, Utilities).
- [ ] **Outstanding Monitor**: Dashboard cards showing "Total Owed to Us" vs "Total We Owe".
- [ ] **Inventory & Waste Tracker**: Log raw materials and "Burn/Unsold" items to adjust equity automatically.

## Core Technical Requirements
- [ ] **Money Handling**: Enforce cents-only integer logic across the entire application. No floats.
- [ ] **Firestore Schema - Accounts**: Implement `accounts` collection containing `id`, `name`, `type`, and `balance`.
- [ ] **Firestore Schema - Journal Entries**: Implement `journal_entries` collection containing `date`, `type`, `status`, `ref_no`, `total_cents`, `outstanding_cents`, `lines` (array of maps), and `metadata`.

## UI/UX
- [ ] **The Level Bar**: Top screen display of Assets vs. Liabilities using Bulma's `.level` component.
- [ ] **Color Coding**: `has-text-success` (Green) for Income/Cleared.
- [ ] **Color Coding**: `has-text-danger` (Red) for Expenses/Overdue.
- [ ] **Color Coding**: `has-text-link` (Blue) for Outstanding receivables.
- [ ] **Action Buttons**: Large, touch-friendly buttons utilizing Solar Icons for mobile tablet use at the bakery counter.

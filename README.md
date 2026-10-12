# Frampton's Delight — Bakery Ledger

Accounting rigorous, user simple. A multi-tenant, double-entry accounting and point-of-sale app for small bakeries, built with React, Vite, Bulma and Firebase.

## Features

- **Double-entry journal** — every transaction posts balanced debit/credit lines; account balances update atomically via Firestore transactions.
- **POS** — cash sales, credit sales/invoices and sales returns (optionally applied to a customer's open invoice).
- **Expenses & purchases** — log vendor bills with dynamic expense categories.
- **Outstanding monitor** — receivables (AR) and payables (AP), with partial payments.
- **Ledger** — searchable transaction list with journal-line detail and void support (reverses balances, keeps the audit trail).
- **Inventory & waste tracking**, items, bundles, customers and vendors.
- **Reports and customer statements.**
- **Admin console** — users, roles, chart of accounts, branding.
- **Cents-only money handling** — integers throughout, no floats.

See [docs/features.md](docs/features.md) and [docs/roadmap.md](docs/roadmap.md) for the full feature tracker and plans.

## Tech stack

React 19 · Vite · React Router · Bulma · react-select · Firebase (Auth, Firestore, Hosting)

## Getting started

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build     # production build into dist/
npm run preview   # preview the production build
npm run lint      # run ESLint
```

## Firebase

Firestore rules and indexes live in `firestore.rules` and `firestore.indexes.json`. Deploy them with:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Deploy the app to Firebase Hosting with:

```bash
npm run build
firebase deploy --only hosting
```

## Project structure

```
src/
  components/   UI: pos, modules (ledger, expenses, reports), admin, auth, layout
  contexts/     Auth and tenant providers
  services/     journalService (double-entry engine), accountService, numberingService
  utils/        moneyUtils (cents helpers)
docs/           feature tracker and roadmap
```

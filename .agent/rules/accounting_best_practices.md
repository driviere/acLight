---
description: Best practices for implementing accounting logic.
---

# Accounting Best Practices

1. **Double-Entry Bookkeeping Validation**
   - Every transaction must have at least one debit and at least one credit.
   - The sum of all debits must equal the sum of all credits for any given transaction layout.
   - If a transaction does not balance, it must be rejected by the system.

2. **Immutability of Ledger Entries**
   - Once a journal entry is posted, it should ideally not be deleted or modified.
   - To correct an error, a new reversing journal entry should be created, or the original entry should be explicitly marked as voided/corrected with an audit trail. 
   - Note: The project spec allows Admins to edit/delete ledger entries, but an intentional trace or log should still accompany such actions to maintain integrity.

3. **Cents-Only Integer Logic**
   - NEVER use floating-point numbers (e.g., `float`, `double`) to represent monetary values.
   - Always store and calculate monetary amounts in their lowest denomination (e.g., cents).
   - `$10.50` must be stored, transmitted, and calculated as `1050`.
   - Only convert to decimal format for UI display purposes immediately prior to rendering.

4. **Chart of Accounts Organization**
   - Maintain clear separation of account types: Assets, Liabilities, Equity, Revenue, and Expenses.
   - Ensure balances conform to their normal balance types (Assets/Expenses are Debit normal; Liabilities/Equity/Revenue are Credit normal).

5. **Clear Audit Trails**
   - Always record timestamps, the user who initiated the transaction (`created_by`), and any relevant reference metadata (e.g., `vendor_name`, `customer_name`, Invoice #, Check #).

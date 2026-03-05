import { collection, doc, runTransaction, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { isBalanced } from '../utils/moneyUtils';

/**
 * Backend Developer & Senior Engineer Implementation.
 * Service to handle absolute transactional integrity for the Bakery Ledger.
 */

const JOURNAL_COLLECTION = 'journal_entries';
const ACCOUNTS_COLLECTION = 'accounts';

/**
 * Helper to determine if an account type's normal balance increases on a debit.
 * DEBIT NORMAL: Assets, Expenses
 * CREDIT NORMAL: Liabilities, Equity, Revenue
 */
const isDebitNormal = (accountType) => {
    return ['asset', 'expense'].includes(accountType.toLowerCase());
};

/**
 * Creates a new double-entry journal entry and updates corresponding account balances atomically.
 * 
 * @param {string} type - e.g., 'sale', 'purchase', 'payment', 'check', 'waste'
 * @param {string} status - e.g., 'unpaid', 'partial', 'paid'
 * @param {string} refNo - External reference (Invoice #, Receipt #)
 * @param {number} totalCents - Total transaction face value
 * @param {number} outstandingCents - Amount remaining to be paid
 * @param {Array<{account_id: string, debit: number, credit: number}>} lines - Transaction lines
 * @param {Object} metadata - { created_by, vendor_name, customer_name, items }
 */
export const createJournalEntry = async (
    type,
    status,
    refNo,
    totalCents,
    outstandingCents,
    lines,
    metadata
) => {
    // 1. Senior Engineer Constraint: Validate Double-Entry Math BEFORE interacting with DB
    const netAmounts = lines.map(l => l.debit - l.credit);
    if (!isBalanced(netAmounts)) {
        throw new Error("Transaction validation failed: Debits do not equal Credits.");
    }

    if (totalCents < 0 || outstandingCents < 0) {
        throw new Error("Transaction validation failed: Amounts cannot be negative.");
    }

    // 2. Backend Developer Constraint: Atomic Database Transaction via runTransaction
    // Transactions ensure that account balance updates are based on the latest data,
    // preventing race conditions where simultaneous updates overwrite each other.
    try {
        await runTransaction(db, async (transaction) => {
            // --- READ PHASE ---
            // Firestore requires all reads to complete before any writes begin.
            const accountSnaps = [];
            for (const line of lines) {
                if (!line.account_id) throw new Error("Missing account_id in transaction line.");

                const accountRef = doc(db, ACCOUNTS_COLLECTION, line.account_id);
                const snap = await transaction.get(accountRef);

                if (!snap.exists()) {
                    throw new Error(`Account ${line.account_id} does not exist in the Chart of Accounts.`);
                }
                accountSnaps.push({ snap, line });
            }

            // --- WRITE PHASE ---
            // Prepare the new journal entry
            const journalRef = doc(collection(db, JOURNAL_COLLECTION));
            const entryData = {
                date: Timestamp.now(),
                type,
                status,
                ref_no: refNo || '',
                total_cents: totalCents,
                outstanding_cents: outstandingCents,
                lines,
                metadata: metadata || {}
            };

            // 1. Write the journal entry
            transaction.set(journalRef, entryData);

            // 2. Write the computed account balances
            for (const { snap, line } of accountSnaps) {
                const accountData = snap.data();
                let currentBalance = accountData.balance || 0;

                // Calculate new balance based on Account Type normal balances
                if (isDebitNormal(accountData.type)) {
                    // Assets & Expenses increase with Debits, decrease with Credits
                    currentBalance += line.debit;
                    currentBalance -= line.credit;
                } else {
                    // Liabilities, Equity, Revenue increase with Credits, decrease with Debits
                    currentBalance += line.credit;
                    currentBalance -= line.debit;
                }

                // PERFORM THE WRITE
                transaction.update(snap.ref, { balance: currentBalance });
            }
        });
        return true;
    } catch (error) {
        console.error("Transaction failed: ", error);
        throw error;
    }
};

/**
 * Voids a journal entry by atomically reversing all account balance effects.
 * The original entry is preserved for audit — only status and metadata change.
 * 
 * @param {string} journalId - ID of the journal entry to void
 * @param {string} userId - UID of the user performing the void
 */
export const voidJournalEntry = async (journalId, userId) => {
    try {
        await runTransaction(db, async (transaction) => {
            // --- READ PHASE ---
            const journalRef = doc(db, JOURNAL_COLLECTION, journalId);
            const journalSnap = await transaction.get(journalRef);

            if (!journalSnap.exists()) {
                throw new Error('Journal entry not found.');
            }

            const journalData = journalSnap.data();

            if (journalData.status === 'void') {
                throw new Error('This entry has already been voided.');
            }

            // Read all accounts referenced in the original lines
            const lines = journalData.lines || [];
            const accountSnaps = [];
            for (const line of lines) {
                const accountRef = doc(db, ACCOUNTS_COLLECTION, line.account_id);
                const snap = await transaction.get(accountRef);
                if (!snap.exists()) {
                    throw new Error(`Account ${line.account_id} does not exist.`);
                }
                accountSnaps.push({ snap, line });
            }

            // --- WRITE PHASE ---
            // 1. Reverse account balance effects (swap debit/credit direction)
            for (const { snap, line } of accountSnaps) {
                const accountData = snap.data();
                let currentBalance = accountData.balance || 0;

                if (isDebitNormal(accountData.type)) {
                    // Original: +debit, -credit  →  Reverse: -debit, +credit
                    currentBalance -= line.debit;
                    currentBalance += line.credit;
                } else {
                    // Original: +credit, -debit  →  Reverse: -credit, +debit
                    currentBalance -= line.credit;
                    currentBalance += line.debit;
                }

                transaction.update(snap.ref, { balance: currentBalance });
            }

            // 2. Mark the journal entry as voided
            transaction.update(journalRef, {
                status: 'void',
                outstanding_cents: 0,
                metadata: {
                    ...journalData.metadata,
                    voided_at: Timestamp.now(),
                    voided_by: userId,
                }
            });
        });
    } catch (error) {
        console.error('Void transaction failed: ', error);
        throw error;
    }
};

/**
 * Processes a payment specifically against an existing invoice/bill.
 * Atomically creates the payment journal entry while reducing the invoice's outstanding balance.
 */
export const processInvoicePayment = async (journalId, paymentCents, paymentType, metadata) => {
    try {
        await runTransaction(db, async (transaction) => {
            // --- READ PHASE ---
            const journalRef = doc(db, JOURNAL_COLLECTION, journalId);
            const journalSnap = await transaction.get(journalRef);
            if (!journalSnap.exists()) throw new Error("Invoice not found.");

            const journalData = journalSnap.data();
            if (journalData.outstanding_cents < paymentCents) {
                throw new Error("Payment exceeds outstanding balance.");
            }

            // Payment bounds
            const lines = [];
            if (paymentType === 'receive') {
                lines.push({ account_id: '1000_cash', debit: paymentCents, credit: 0 });
                lines.push({ account_id: '1200_ar', debit: 0, credit: paymentCents });
            } else {
                lines.push({ account_id: '2000_ap', debit: paymentCents, credit: 0 });
                lines.push({ account_id: '1000_cash', debit: 0, credit: paymentCents });
            }

            // Read all involved accounts
            const accountSnaps = [];
            for (const line of lines) {
                const accountRef = doc(db, ACCOUNTS_COLLECTION, line.account_id);
                const snap = await transaction.get(accountRef);
                if (!snap.exists()) throw new Error(`Account ${line.account_id} does not exist.`);
                accountSnaps.push({ snap, line });
            }

            // --- DATA COMPUTATION ---
            const newOutstanding = journalData.outstanding_cents - paymentCents;
            const newStatus = newOutstanding === 0 ? 'paid' : 'partial';

            // --- WRITE PHASE ---
            // 1. Update the existing invoice
            transaction.update(journalRef, {
                status: newStatus,
                outstanding_cents: newOutstanding
            });

            // 2. Create the payment journal entry attached to this invoice
            const paymentRef = doc(collection(db, JOURNAL_COLLECTION));
            const entryType = paymentType === 'receive' ? 'payment' : 'payment_sent';
            transaction.set(paymentRef, {
                date: Timestamp.now(),
                type: entryType,
                status: 'paid',
                ref_no: metadata.refNo || '',
                total_cents: paymentCents,
                outstanding_cents: 0,
                lines,
                metadata: { ...metadata, related_invoice_id: journalId, payment_type: paymentType }
            });

            // 3. Update account balances 
            for (const { snap, line } of accountSnaps) {
                const accountData = snap.data();
                let currentBalance = accountData.balance || 0;

                if (isDebitNormal(accountData.type)) {
                    currentBalance += line.debit;
                    currentBalance -= line.credit;
                } else {
                    currentBalance += line.credit;
                    currentBalance -= line.debit;
                }
                transaction.update(snap.ref, { balance: currentBalance });
            }
        });
    } catch (error) {
        console.error("Payment transaction failed: ", error);
        throw error;
    }
};

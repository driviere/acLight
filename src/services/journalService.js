import { collection, doc, writeBatch, Timestamp, getDoc } from 'firebase/firestore';
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

    // 2. Backend Developer Constraint: Atomic Database Transaction
    // WriteBatch ensures that if ANY account update fails, the entire transaction is rolled back.
    const batch = writeBatch(db);

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

    batch.set(journalRef, entryData);

    // Prepare account balance updates
    // We must read the accounts first to know their current balances and types.
    for (const line of lines) {
        if (!line.account_id) throw new Error("Missing account_id in transaction line.");

        const accountRef = doc(db, ACCOUNTS_COLLECTION, line.account_id);
        const accountSnap = await getDoc(accountRef);

        if (!accountSnap.exists()) {
            throw new Error(`Account ${line.account_id} does not exist in the Chart of Accounts.`);
        }

        const accountData = accountSnap.data();
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

        // Add the update to our atomic batch
        batch.update(accountRef, { balance: currentBalance });
    }

    // 3. Commit the atomic operation to Firestore
    await batch.commit();

    return journalRef.id;
};

export const updatePaymentStatus = async (journalId, newStatus, newOutstandingCents) => {
    const journalRef = doc(db, JOURNAL_COLLECTION, journalId);
    await writeBatch(db).update(journalRef, {
        status: newStatus,
        outstanding_cents: newOutstandingCents
    }).commit();
};

/**
 * Processes a payment specifically against an existing invoice/bill.
 * Atomically creates the payment journal entry while reducing the invoice's outstanding balance.
 */
export const processInvoicePayment = async (journalId, paymentCents, paymentType, metadata) => {
    const journalRef = doc(db, JOURNAL_COLLECTION, journalId);
    const journalSnap = await getDoc(journalRef);
    if (!journalSnap.exists()) throw new Error("Invoice not found.");

    const journalData = journalSnap.data();
    if (journalData.outstanding_cents < paymentCents) {
        throw new Error("Payment exceeds outstanding balance.");
    }

    const newOutstanding = journalData.outstanding_cents - paymentCents;
    const newStatus = newOutstanding === 0 ? 'paid' : 'partial';

    // Payment bounds
    const lines = [];
    if (paymentType === 'receive') {
        lines.push({ account_id: '1000_cash', debit: paymentCents, credit: 0 });
        lines.push({ account_id: '1200_ar', debit: 0, credit: paymentCents });
    } else {
        lines.push({ account_id: '2000_ap', debit: paymentCents, credit: 0 });
        lines.push({ account_id: '1000_cash', debit: 0, credit: paymentCents });
    }

    const batch = writeBatch(db);

    // Update the existing invoice
    batch.update(journalRef, {
        status: newStatus,
        outstanding_cents: newOutstanding
    });

    // Create the payment journal entry attached to this invoice
    const paymentRef = doc(collection(db, JOURNAL_COLLECTION));
    batch.set(paymentRef, {
        date: Timestamp.now(),
        type: 'payment',
        status: 'paid',
        ref_no: metadata.refNo || '',
        total_cents: paymentCents,
        outstanding_cents: 0,
        lines,
        metadata: { ...metadata, related_invoice_id: journalId, payment_type: paymentType }
    });

    // Update account balances
    for (const line of lines) {
        const accountRef = doc(db, ACCOUNTS_COLLECTION, line.account_id);
        const accountSnap = await getDoc(accountRef);
        if (!accountSnap.exists()) throw new Error(`Account ${line.account_id} does not exist.`);

        const accountData = accountSnap.data();
        let currentBalance = accountData.balance || 0;

        if (isDebitNormal(accountData.type)) {
            currentBalance += line.debit;
            currentBalance -= line.credit;
        } else {
            currentBalance += line.credit;
            currentBalance -= line.debit;
        }
        batch.update(accountRef, { balance: currentBalance });
    }

    await batch.commit();
};

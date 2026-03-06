import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Backend Developer Implementation
 * Generates sequential numbers safely using Firestore transactions.
 */

const COUNTERS_COLLECTION = 'counters';

/**
 * Ensures a counter document exists, creating it with defaults if it doesn't.
 * @param {string} tenantId
 * @param {string} counterId - The ID of the counter document (e.g. 'invoice_counter')
 * @param {string} prefix - The prefix for the generated string (e.g. 'INV-')
 */
const initializeCounter = async (tenantId, counterId, prefix) => {
    const counterRef = doc(db, 'tenants', tenantId, COUNTERS_COLLECTION, counterId);
    const snap = await getDoc(counterRef);
    if (!snap.exists()) {
        await setDoc(counterRef, {
            last_number: 0,
            prefix: prefix
        });
    }
};

/**
 * Atomically increments the specified counter and returns the formatted string.
 * Uses a transaction to guarantee uniqueness even under concurrent access.
 * 
 * @param {string} tenantId
 * @param {string} counterId 
 * @param {string} prefix 
 * @param {number} padLength - How many digits to pad the number to (e.g., 4 -> '0042')
 * @returns {Promise<string>} e.g., 'INV-0042'
 */
const getNextNumber = async (tenantId, counterId, prefix, padLength = 4) => {
    if (!tenantId) throw new Error("tenantId is required");
    await initializeCounter(tenantId, counterId, prefix);

    const counterRef = doc(db, 'tenants', tenantId, COUNTERS_COLLECTION, counterId);

    return await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(counterRef);
        if (!snap.exists()) {
            throw new Error(`Counter ${counterId} does not exist even after initialization attempt.`);
        }

        const data = snap.data();
        const nextNum = (data.last_number || 0) + 1;

        // Update the counter
        transaction.update(counterRef, { last_number: nextNum });

        // Format string: PREFIX-0001
        const paddedNum = String(nextNum).padStart(padLength, '0');
        return `${data.prefix || prefix}${paddedNum}`;
    });
};

/**
 * Retrieves the next available Invoice Number. (e.g., INV-0042)
 * @param {string} tenantId
 */
export const getNextInvoiceNumber = async (tenantId) => {
    return await getNextNumber(tenantId, 'invoice_counter', 'INV-', 4);
};

/**
 * Retrieves the next available Receipt Number. (e.g., REC-0158)
 * @param {string} tenantId
 */
export const getNextReceiptNumber = async (tenantId) => {
    return await getNextNumber(tenantId, 'receipt_counter', 'REC-', 4);
};

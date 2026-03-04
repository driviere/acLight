/**
 * Utility functions for handling Cents-Only Integer Logic in the Bakery Ledger.
 * 
 * Rules:
 * - All calculations, states, and DB interactions MUST use these cents (integers).
 * - NEVER use floats for financial math.
 * - Only convert to decimal string representation immediately before display.
 */

/**
 * Converts a UI input decimal string (e.g., "10.50") to an integer of cents (1050).
 * Handles floating point inconsistencies gracefully by rounding.
 * @param {string|number} uiAmount - The dollar amount input
 * @returns {number} The integer representation in cents
 */
export const toCents = (uiAmount) => {
    if (uiAmount === null || uiAmount === undefined) return 0;

    // Convert to string to avoid all float math errors and strictly slice 2 decimal places
    let strAmount = String(uiAmount).trim();
    if (!strAmount) return 0;

    const parts = strAmount.split('.');

    let whole = parts[0] ? parseInt(parts[0], 10) : 0;
    if (isNaN(whole)) return 0;

    let fraction = 0;
    if (parts.length > 1) {
        let fracStr = parts[1].substring(0, 2); // Rigidly drop 3rd+ decimal place
        if (fracStr.length === 1) fracStr += '0'; // "1.5" -> "50"
        fraction = parseInt(fracStr, 10);
    }

    const isNegative = strAmount.startsWith('-');
    const totalCents = (Math.abs(whole) * 100) + fraction;

    return isNegative ? -totalCents : totalCents;
};

/**
 * Converts integer cents (e.g., 1050) back to a formatted dollar string ("10.50").
 * Used strictly for UI rendering.
 * @param {number} cents - The integer amount in cents
 * @returns {string} The formatted decimal string
 */
export const toDollarsData = (cents) => {
    if (cents === null || cents === undefined || isNaN(cents)) return "0.00";

    // Force strict integer logic, discard any accidental decimals that snuck in
    const safeInt = Math.floor(cents);
    return (safeInt / 100).toFixed(2);
};

/**
 * Same as toDollarsData, but prepends a "$" sign.
 * @param {number} cents 
 * @returns {string} Formatted string like "$10.50"
 */
export const formatCurrency = (cents) => {
    return `$${toDollarsData(cents)}`;
}

/**
 * Validates that a transaction balances out to exactly 0 cents.
 * Double-Entry Principle: Sum of Debits and Credits must equal 0.
 * In our system, Debits are positive, Credits are negative (or vice versa, as long as it sums to 0).
 * @param {number[]} amounts - Array of cent values 
 * @returns {boolean} True if perfectly balanced.
 */
export const isBalanced = (amounts) => {
    if (!amounts || amounts.length === 0) return false;
    const sum = amounts.reduce((acc, curr) => acc + Math.round(curr), 0);
    return sum === 0;
};

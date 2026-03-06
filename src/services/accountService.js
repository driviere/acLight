import { doc, setDoc, getDoc, collection, getDocs, writeBatch, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Service to manage Chart of Accounts interactions.
 */

const ACCOUNTS_COLLECTION = "accounts";

/**
 * The standard Chart of Accounts required for a basic Bakery execution.
 */
export const INITIAL_CHART_OF_ACCOUNTS = [
    // ASSETS (Normal Balance: Debit)
    { id: "1000_cash", name: "Cash on Hand", type: "asset", balance: 0 },
    { id: "1010_bank", name: "Business Bank Account", type: "asset", balance: 0 },
    { id: "1200_ar", name: "Accounts Receivable", type: "asset", balance: 0 },
    { id: "1400_inventory", name: "Inventory", type: "asset", balance: 0 },

    // LIABILITIES (Normal Balance: Credit)
    { id: "2000_ap", name: "Accounts Payable", type: "liability", balance: 0 },
    { id: "2100_taxes", name: "Sales Tax Payable", type: "liability", balance: 0 },

    // EQUITY (Normal Balance: Credit)
    { id: "3000_equity", name: "Owner's Equity", type: "equity", balance: 0 },
    { id: "3900_retained", name: "Retained Earnings", type: "equity", balance: 0 },

    // REVENUE (Normal Balance: Credit)
    { id: "4000_revenue", name: "Sales Revenue", type: "revenue", balance: 0 },
    { id: "4100_service", name: "Service Revenue", type: "revenue", balance: 0 },

    // EXPENSES (Normal Balance: Debit)
    { id: "5000_cogs", name: "Cost of Goods Sold", type: "expense", balance: 0 },
    { id: "5100_operating", name: "Operating Expenses", type: "expense", balance: 0 },
    { id: "6000_rent", name: "Rent & Lease", type: "expense", balance: 0 },
    { id: "6100_utilities", name: "Utilities", type: "expense", balance: 0 },
    { id: "6200_payroll", name: "Payroll", type: "expense", balance: 0 },
    { id: "6300_supplies", name: "Supplies & Materials", type: "expense", balance: 0 }
];

/**
 * Seeds the initial chart of accounts into Firestore if the collection is empty.
 * This utilizes a batch write to ensure all base accounts are created atomically.
 * @param {string} tenantId - The ID of the tenant
 * @returns {Promise<boolean>} True if seeded, False if already exists.
 */
export const seedChartOfAccounts = async (tenantId) => {
    if (!tenantId) throw new Error("tenantId is required");
    try {
        // First check if accounts already exist so we don't overwrite user data
        const accountsColl = collection(db, 'tenants', tenantId, ACCOUNTS_COLLECTION);
        const querySnapshot = await getDocs(accountsColl);

        if (!querySnapshot.empty) {
            console.log("Chart of Accounts already exists. Skipping seed.");
            return false;
        }

        console.log("Initializing base Chart of Accounts...");
        const batch = writeBatch(db);

        const now = Timestamp.now();
        INITIAL_CHART_OF_ACCOUNTS.forEach((account) => {
            const docRef = doc(db, 'tenants', tenantId, ACCOUNTS_COLLECTION, account.id);
            batch.set(docRef, { ...account, created_at: now, updated_at: now });
        });

        await batch.commit();
        console.log("Chart of Accounts seeded successfully.");
        return true;

    } catch (error) {
        console.error("Error seeding chart of accounts:", error);
        throw error; // Rethrow to let the UI catch it
    }
};

/**
 * Fetches all accounts from Firestore, sorted by ID.
 * @param {string} tenantId 
 */
export const getAllAccounts = async (tenantId) => {
    if (!tenantId) throw new Error("tenantId is required");
    const querySnapshot = await getDocs(collection(db, 'tenants', tenantId, ACCOUNTS_COLLECTION));
    return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.id.localeCompare(b.id));
};

/**
 * Adds a new account to the Chart of Accounts.
 * @param {string} tenantId 
 */
export const addAccount = async (tenantId, id, name, type) => {
    if (!tenantId) throw new Error("tenantId is required");
    const trimmedId = id.trim().toLowerCase().replace(/\s+/g, '_');
    if (!trimmedId || !name || !type) throw new Error('ID, name, and type are required.');
    const docRef = doc(db, 'tenants', tenantId, ACCOUNTS_COLLECTION, trimmedId);
    const existing = await getDoc(docRef);
    if (existing.exists()) throw new Error(`Account ID "${trimmedId}" already exists.`);
    const now = Timestamp.now();
    await setDoc(docRef, { id: trimmedId, name: name.trim(), type, balance: 0, active: true, created_at: now, updated_at: now });
};

/**
 * Updates an account's editable fields (name, active status).
 * @param {string} tenantId 
 */
export const updateAccount = async (tenantId, id, updates) => {
    if (!tenantId) throw new Error("tenantId is required");
    const docRef = doc(db, 'tenants', tenantId, ACCOUNTS_COLLECTION, id);
    await updateDoc(docRef, { ...updates, updated_at: Timestamp.now() });
};

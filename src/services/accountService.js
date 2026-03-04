import { doc, setDoc, getDoc, collection, getDocs, writeBatch } from "firebase/firestore";
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
    { id: "1000_cash", name: "Main Cash Drawer", type: "asset", balance: 0 },
    { id: "1010_bank", name: "Business Checking Account", type: "asset", balance: 0 },
    { id: "1200_ar", name: "Accounts Receivable", type: "asset", balance: 0 },
    { id: "1400_inventory", name: "Raw Materials Inventory", type: "asset", balance: 0 },

    // LIABILITIES (Normal Balance: Credit)
    { id: "2000_ap", name: "Accounts Payable", type: "liability", balance: 0 },
    { id: "2100_taxes", name: "Sales Tax Payable", type: "liability", balance: 0 },

    // EQUITY (Normal Balance: Credit)
    { id: "3000_equity", name: "Owner's Equity", type: "equity", balance: 0 },
    { id: "3900_retained", name: "Retained Earnings", type: "equity", balance: 0 },

    // REVENUE (Normal Balance: Credit)
    { id: "4000_sales_bread", name: "Bread Sales", type: "revenue", balance: 0 },
    { id: "4010_sales_pastry", name: "Pastry Sales", type: "revenue", balance: 0 },

    // EXPENSES (Normal Balance: Debit)
    { id: "5000_cogs", name: "Cost of Goods Sold (Ingredients)", type: "expense", balance: 0 },
    { id: "5100_waste", name: "Spoilage & Waste", type: "expense", balance: 0 },
    { id: "6000_rent", name: "Bakery Lease", type: "expense", balance: 0 },
    { id: "6100_utilities", name: "Utilities & Power", type: "expense", balance: 0 },
    { id: "6200_payroll", name: "Payroll Expense", type: "expense", balance: 0 }
];

/**
 * Seeds the initial chart of accounts into Firestore if the collection is empty.
 * This utilizes a batch write to ensure all base accounts are created atomically.
 * @returns {Promise<boolean>} True if seeded, False if already exists.
 */
export const seedChartOfAccounts = async () => {
    try {
        // First check if accounts already exist so we don't overwrite user data
        const querySnapshot = await getDocs(collection(db, ACCOUNTS_COLLECTION));

        if (!querySnapshot.empty) {
            console.log("Chart of Accounts already exists. Skipping seed.");
            return false;
        }

        console.log("Initializing base Chart of Accounts...");
        const batch = writeBatch(db);

        INITIAL_CHART_OF_ACCOUNTS.forEach((account) => {
            const docRef = doc(db, ACCOUNTS_COLLECTION, account.id);
            batch.set(docRef, account);
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
 * Fetches all accounts securely from Firestore.
 */
export const getAllAccounts = async () => {
    const querySnapshot = await getDocs(collection(db, ACCOUNTS_COLLECTION));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

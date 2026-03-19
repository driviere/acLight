import { collection, doc, setDoc, getDocs, updateDoc, Timestamp, query, where, limit, getCountFromServer, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';

import { sendSignInLinkToEmail, sendPasswordResetEmail } from 'firebase/auth';
import { seedChartOfAccounts } from './accountService';


/**
 * Super-Admin Service Implementation
 * Handles provisioning and managing tenants (businesses) on the SaaS platform.
 */

const TENANTS_COLLECTION = 'tenants';

/**
 * Provisions a new isolated Tenant workspace.
 * Sets up the base tenant document and seeds the initial Chart of Accounts.
 * @param {string} tenantName - The business name
 * @param {string} ownerEmail - Email of the business owner (to be invited)
 */
export const createTenant = async (tenantName, ownerEmail) => {
    if (!tenantName || !ownerEmail) throw new Error("tenantName and ownerEmail are required");

    try {
        // 1. Create the tenant document
        const tenantRef = doc(collection(db, TENANTS_COLLECTION));
        const tenantId = tenantRef.id;

        const tenantData = {
            name: tenantName.trim(),
            owner_email: ownerEmail.toLowerCase().trim(),
            status: 'active',
            branding: {
                primary_color: '#00b894', // default Bakery Ledger green
                logo_url: null
            },
            created_at: Timestamp.now(),
            updated_at: Timestamp.now()
        };

        await setDoc(tenantRef, tenantData);

        // 2. Send Invitation Email (Firebase Sign-in Link)
        const actionCodeSettings = {
            url: window.location.origin + '/login',
            handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, ownerEmail, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', ownerEmail); // Local helper for confirmation

        // 2. Seed the Chart of Accounts into the new tenant's subcollection
        await seedChartOfAccounts(tenantId);

        return tenantId;
    } catch (err) {
        console.error("Failed to provision new tenant:", err);
        throw err;
    }
};

/**
 * Fetches all registered tenants (Super-Admin only).
 */
export const getAllTenants = async () => {
    const snaps = await getDocs(collection(db, TENANTS_COLLECTION));
    return snaps.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Enables or disables a tenant.
 * @param {string} tenantId 
 * @param {boolean} isActive 
 */
export const updateTenantStatus = async (tenantId, isActive) => {
    const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);
    await updateDoc(tenantRef, {
        status: isActive ? 'active' : 'disabled',
        updated_at: Timestamp.now()
    });
};

/**
 * Sends a password reset email to the given address.
 * @param {string} email 
 */
export const sendAdminPasswordReset = async (email) => {
    if (!email) throw new Error("Email is required for password reset");
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
};

/**
 * Fetches activity statistics for a specific tenant (transaction count & last active date).
 * @param {string} tenantId 
 */
export const getTenantActivityStats = async (tenantId) => {
    try {
        const jColl = collection(db, TENANTS_COLLECTION, tenantId, 'journal_entries');
        
        // 1. Get total transaction count
        const countSnap = await getCountFromServer(jColl);
        const totalTransactions = countSnap.data().count;

        // 2. Get latest transaction date
        const qLatest = query(jColl, orderBy('date', 'desc'), limit(1));
        const latestSnap = await getDocs(qLatest);
        let lastActive = null;
        if (!latestSnap.empty) {
            lastActive = latestSnap.docs[0].data().date;
        }

        return { totalTransactions, lastActive };
    } catch (err) {
        console.error(`Failed to get activity for tenant ${tenantId}:`, err);
        return { totalTransactions: 0, lastActive: null };
    }
};


import { collection, doc, setDoc, getDocs, updateDoc, Timestamp, query, where, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { sendSignInLinkToEmail } from 'firebase/auth';
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

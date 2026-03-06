import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const TenantContext = createContext();

export const useTenant = () => {
    return useContext(TenantContext);
};

export const TenantProvider = ({ children }) => {
    const { currentUser, tenantId: authTenantId } = useAuth();
    const [tenantData, setTenantData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser || !authTenantId) {
            setTenantData(null);
            setLoading(false);
            return;
        }

        // Use onSnapshot for real-time branding/name updates
        const tenantDocRef = doc(db, 'tenants', authTenantId);
        const unsubscribe = onSnapshot(tenantDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTenantData(data);

                // Apply dynamic branding to CSS variables
                const branding = data.branding || {};
                if (branding.primary_color) {
                    document.documentElement.style.setProperty('--bl-primary-dynamic', branding.primary_color);
                }
                if (branding.header_color) {
                    document.documentElement.style.setProperty('--bl-header-dynamic', branding.header_color);
                }
            }
            setLoading(false);
        }, (error) => {
            console.error("Error resolving tenant:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, authTenantId]);

    const value = {
        tenantId: authTenantId,
        tenantData,
        branding: tenantData?.branding || {},
        isTenantLoaded: !!tenantData
    };

    return (
        <TenantContext.Provider value={value}>
            {!loading && children}
        </TenantContext.Provider>
    );
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc, limit } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'admin', 'staff', or 'super_admin'
    const [tenantId, setTenantId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Login function
    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Logout function
    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserRole(data.role || 'staff');
                        setTenantId(data.tenant_id || null);
                    } else {
                        // User document doesn't exist -> Check if they were invited as an owner
                        const inviteQuery = query(
                            collection(db, 'tenants'),
                            where('owner_email', '==', user.email.toLowerCase()),
                            limit(1)
                        );
                        const inviteSnap = await getDocs(inviteQuery);

                        if (!inviteSnap.empty) {
                            const invitedTenant = inviteSnap.docs[0];
                            const invitedTenantId = invitedTenant.id;

                            // Provision user document automatically
                            await setDoc(doc(db, 'users', user.uid), {
                                email: user.email,
                                role: 'admin',
                                tenant_id: invitedTenantId,
                                createdAt: new Date()
                            });

                            setUserRole('admin');
                            setTenantId(invitedTenantId);
                        } else {
                            // Not invited — boot them out
                            await signOut(auth);
                            setUserRole(null);
                            setTenantId(null);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUserRole('staff');
                    setTenantId(null);
                }
            } else {
                setUserRole(null);
                setTenantId(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        tenantId,
        login,
        logout,
        isAdmin: userRole === 'admin',
        isStaff: userRole === 'staff',
        isSuperAdmin: userRole === 'super_admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

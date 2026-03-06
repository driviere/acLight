import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PrivateRoute({ children, requireAdmin, requireSuperAdmin }) {
    const { currentUser, isAdmin, isSuperAdmin } = useAuth();

    if (!currentUser) {
        // Not logged in, redirect to login page
        return <Navigate to="/login" />;
    }

    if (requireAdmin && !isAdmin && !isSuperAdmin) {
        // Logged in but not an admin or super admin, redirect to standard dashboard
        return <Navigate to="/" />;
    }

    if (requireSuperAdmin && !isSuperAdmin) {
        // Logged in but not a super admin, redirect to standard dashboard
        return <Navigate to="/" />;
    }

    // Authorized, render children
    return children;
}

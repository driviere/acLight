import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PrivateRoute({ children, requireAdmin }) {
    const { currentUser, isAdmin } = useAuth();

    if (!currentUser) {
        // Not logged in, redirect to login page
        return <Navigate to="/login" />;
    }

    if (requireAdmin && !isAdmin) {
        // Logged in but not an admin, redirect to standard dashboard
        return <Navigate to="/" />;
    }

    // Authorized, render children
    return children;
}

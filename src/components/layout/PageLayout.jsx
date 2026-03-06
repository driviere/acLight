import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { Navigation, PageHeader } from '../../App';

/**
 * Standard Page Layout for Bakery Ledger.
 * Provides consistent structure with Header, Nav, and Content.
 */
const PageLayout = ({ children, title, subtitle, icon, requireAdmin = false }) => {
    const { isAdmin, isSuperAdmin } = useAuth();

    // Authorization check
    if (requireAdmin && !isAdmin && !isSuperAdmin) {
        return (
            <div className="section has-text-centered">
                <div className="notification is-danger">
                    Access Denied: Admin permissions required.
                </div>
            </div>
        );
    }

    return (
        <div className="page-container fadeIn">
            {title && (
                <PageHeader title={title} subtitle={subtitle} icon={icon} />
            )}
            <div className="content-area">
                {children}
            </div>
        </div>
    );
};

export default PageLayout;

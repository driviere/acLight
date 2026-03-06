import React, { useState } from 'react';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { UserPlusBold, BoxBold, UsersGroupTwoRoundedBold, BuildingsBold, SettingsBold, ChartBold, LayersBold, PaletteBold, UserCircleBold } from 'solar-icon-set';
import CustomerManager from './CustomerManager';
import VendorManager from './VendorManager';
import ItemManager from './ItemManager';
import BundleManager from './BundleManager';
import UserManager from './UserManager';
import BrandingManager from './BrandingManager';
import AccountManager from './AccountManager'; // Account/security manager
import PageLayout from '../layout/PageLayout';

// Secondary Firebase app for creating users without logging out current admin.
const tempApp = initializeApp({
    apiKey: "AIzaSyCOqWVqkpLv4jX7uFziWnEfgBpSQJxKM28",
    authDomain: "aclight-l33t.firebaseapp.com",
    projectId: "aclight-l33t",
    storageBucket: "aclight-l33t.firebasestorage.app",
    messagingSenderId: "201323145695",
    appId: "1:201323145695:web:d22411f05e38f1d9cbfc6a"
}, "TempAppForCreation");
const tempAuth = getAuth(tempApp);

const TABS = [
    { id: 'users', label: 'Users', icon: <UserPlusBold size={16} /> },
    { id: 'items', label: 'Items', icon: <BoxBold size={16} /> },
    { id: 'bundles', label: 'Bundles', icon: <LayersBold size={16} /> },
    { id: 'customers', label: 'Customers', icon: <UsersGroupTwoRoundedBold size={16} /> },
    { id: 'vendors', label: 'Vendors', icon: <BuildingsBold size={16} /> },
    { id: 'branding', label: 'Branding', icon: <PaletteBold size={16} /> },
    { id: 'account_security', label: 'Account', icon: <UserCircleBold size={16} /> },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('users');

    return (
        <PageLayout
            title="Admin Dashboard"
            subtitle="Manage users, inventory, customers, and vendors."
            icon={<SettingsBold size={24} />}
        >
            {/* Bulma Tabs as Pills */}
            <div className="tabs is-pills mb-5">
                <ul>
                    {TABS.map(tab => (
                        <li key={tab.id} className={activeTab === tab.id ? 'is-active' : ''}>
                            <a onClick={() => setActiveTab(tab.id)} style={{ cursor: 'pointer' }}>
                                <span className="icon is-small">{tab.icon}</span>
                                <span>{tab.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Tab content */}
            {activeTab === 'users' && <UserManager />}
            {activeTab === 'items' && <ItemManager />}
            {activeTab === 'bundles' && <BundleManager />}
            {activeTab === 'customers' && <CustomerManager />}
            {activeTab === 'vendors' && <VendorManager />}
            {activeTab === 'branding' && <BrandingManager />}
            {activeTab === 'account_security' && <AccountManager />}
        </PageLayout>
    );
}

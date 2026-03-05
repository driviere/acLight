import React, { useState } from 'react';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { UserPlusBold, BoxBold, UsersGroupTwoRoundedBold, BuildingsBold, SettingsBold, ChartBold, LayersBold } from 'solar-icon-set';
import CustomerManager from './CustomerManager';
import VendorManager from './VendorManager';
import ItemManager from './ItemManager';
import BundleManager from './BundleManager';
import UserManager from './UserManager';
import AccountManager from './AccountManager';
import { PageHeader } from '../../App';

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
    { id: 'accounts', label: 'Accounts', icon: <ChartBold size={16} /> },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('users');

    return (
        <div>
            <PageHeader
                title="Admin Dashboard"
                subtitle="Manage users, inventory, customers, and vendors."
                icon={<SettingsBold size={24} />}
            />

            {/* Bulma Tabs */}
            <div className="tabs is-boxed mb-5">
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
            {activeTab === 'accounts' && <AccountManager />}
        </div>
    );
}

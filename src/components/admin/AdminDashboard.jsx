import React, { useState } from 'react';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { UserPlusBold, BoxBold, UsersGroupTwoRoundedBold, BuildingsBold, SettingsBold } from 'solar-icon-set';
import CustomerManager from './CustomerManager';
import VendorManager from './VendorManager';
import ItemManager from './ItemManager';
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
    { id: 'customers', label: 'Customers', icon: <UsersGroupTwoRoundedBold size={16} /> },
    { id: 'vendors', label: 'Vendors', icon: <BuildingsBold size={16} /> },
];

function CreateUserPanel() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('staff');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const credential = await createUserWithEmailAndPassword(tempAuth, email, password);
            await setDoc(doc(db, 'users', credential.user.uid), { email, role, createdAt: new Date() });
            await tempAuth.signOut();
            setMessage({ type: 'success', text: `Successfully created ${role} user: ${email}` });
            setEmail('');
            setPassword('');
        } catch (error) {
            console.error(error);
            setMessage({ type: 'danger', text: error.message });
        }
        setLoading(false);
    };

    return (
        <div className="box" style={{ maxWidth: '560px' }}>
            {message.text && (
                <div className={`notification is-${message.type} is-light mb-4`}>
                    <button className="delete" onClick={() => setMessage({ type: '', text: '' })}></button>
                    {message.text}
                </div>
            )}
            <form onSubmit={handleCreateUser}>
                <div className="field">
                    <label className="label">New User Email</label>
                    <div className="control">
                        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="staff@bakery.com" />
                    </div>
                </div>
                <div className="field">
                    <label className="label">Temporary Password <span className="has-text-grey">(min 6 chars)</span></label>
                    <div className="control">
                        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" placeholder="••••••••" />
                    </div>
                </div>
                <div className="field">
                    <label className="label">Role</label>
                    <div className="control">
                        <div className="select is-fullwidth">
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="staff">Staff — Sales, Waste, View</option>
                                <option value="admin">Admin — Full Access, P&L, Ledgers</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="field mt-5">
                    <button
                        className={`button is-primary is-fullwidth ${loading ? 'is-loading' : ''}`}
                        type="submit"
                        disabled={loading || password.length < 6}
                        style={{ height: '52px', fontSize: '1rem' }}
                    >
                        <span className="icon"><UserPlusBold size={18} /></span>
                        <span>Create System User</span>
                    </button>
                </div>
            </form>
        </div>
    );
}

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
            {activeTab === 'users' && <CreateUserPanel />}
            {activeTab === 'items' && <ItemManager />}
            {activeTab === 'customers' && <CustomerManager />}
            {activeTab === 'vendors' && <VendorManager />}
        </div>
    );
}

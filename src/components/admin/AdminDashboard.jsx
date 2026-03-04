import React, { useState } from 'react';
import { db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { UserPlusBold } from 'solar-icon-set';
import CustomerManager from './CustomerManager';
import VendorManager from './VendorManager';
import ItemManager from './ItemManager';

// Note: To create users client-side without logging out the current Admin User,
// we initialize a secondary, temporary Firebase app instance just for user creation.
// In a full production app, this should be moved to a secure Firebase Cloud Function.
const tempApp = initializeApp({
    apiKey: "AIzaSyCOqWVqkpLv4jX7uFziWnEfgBpSQJxKM28",
    authDomain: "aclight-l33t.firebaseapp.com",
    projectId: "aclight-l33t",
    storageBucket: "aclight-l33t.firebasestorage.app",
    messagingSenderId: "201323145695",
    appId: "1:201323145695:web:d22411f05e38f1d9cbfc6a"
}, "TempAppForCreation");
const tempAuth = getAuth(tempApp);

export default function AdminDashboard() {
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
            // 1. Create user in Firebase Auth using the secondary app instance
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
            const newUserId = userCredential.user.uid;

            // 2. Add their role to Firestore 'users' collection
            await setDoc(doc(db, 'users', newUserId), {
                email: email,
                role: role,
                createdAt: new Date()
            });

            // 3. Sign out the temporary app instance
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
        <div className="box mt-5">
            <h2 className="title is-4">Admin Dashboard: Create Users</h2>
            <hr />

            {message.text && (
                <div className={`notification is-${message.type} is-light`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleCreateUser}>
                <div className="field">
                    <label className="label">New User Email</label>
                    <div className="control">
                        <input
                            className="input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="field">
                    <label className="label">Temporary Password (min 6 chars)</label>
                    <div className="control">
                        <input
                            className="input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="6"
                        />
                    </div>
                </div>

                <div className="field">
                    <label className="label">Role Assignment</label>
                    <div className="control">
                        <div className="select is-fullwidth">
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="staff">Staff (Sales, Waste, View Inventory)</option>
                                <option value="admin">Admin (Manage Users, P&L, Edit Ledgers)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="field mt-5">
                    <div className="control">
                        <button
                            className={`button is-primary is-large is-fullwidth ${loading ? 'is-loading' : ''}`}
                            type="submit"
                            disabled={loading || password.length < 6}
                        >
                            <span className="icon"><UserPlusBold size={16} /></span>
                            <span>Create System User</span>
                        </button>
                    </div>
                </div>
            </form>

            <hr className="mt-6 mb-6" />

            <div className="columns is-multiline">
                <div className="column is-12">
                    <ItemManager />
                </div>
                <div className="column is-6">
                    <CustomerManager />
                </div>
                <div className="column is-6">
                    <VendorManager />
                </div>
            </div>
        </div>
    );
}

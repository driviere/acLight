import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { doc as fsDoc, setDoc, query, where } from 'firebase/firestore';
import { useTenant } from '../../contexts/TenantContext';
import { UsersGroupTwoRoundedBold, UserPlusBold, CheckSquareBold, CloseSquareBold, ShieldUserBold, PenNewSquareBold, TrashBinMinimalisticBold } from 'solar-icon-set';

// Secondary Firebase app for creating users without logging out current admin
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCOqWVqkpLv4jX7uFziWnEfgBpSQJxKM28",
    authDomain: "aclight-l33t.firebaseapp.com",
    projectId: "aclight-l33t",
    storageBucket: "aclight-l33t.firebasestorage.app",
    messagingSenderId: "201323145695",
    appId: "1:201323145695:web:d22411f05e38f1d9cbfc6a"
};
let tempApp;
try {
    tempApp = initializeApp(FIREBASE_CONFIG, "TempAppForCreation");
} catch (e) {
    tempApp = getApps().find(a => a.name === "TempAppForCreation");
}
const tempAuth = getAuth(tempApp);

const ROLE_COLORS = { admin: 'is-danger', staff: 'is-info' };
const ROLE_LABELS = { admin: '🔑 Admin', staff: '👤 Staff' };

export default function UserManager() {
    const { tenantId } = useTenant();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editRole, setEditRole] = useState('staff');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Create form state
    const [showCreate, setShowCreate] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('staff');
    const [creating, setCreating] = useState(false);

    const fetchUsers = async () => {
        if (!tenantId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const q = query(collection(db, 'users'), where('tenant_id', '==', tenantId));
            const snap = await getDocs(q);
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(list.sort((a, b) => (a.email || '').localeCompare(b.email || '')));
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, [tenantId]);

    const startEdit = (user) => {
        setEditingId(user.id);
        setEditRole(user.role || 'staff');
    };

    const handleSaveRole = async (id) => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', id), { role: editRole });
            setEditingId(null);
            fetchUsers();
            setMessage({ type: 'success', text: 'Role updated successfully.' });
        } catch (err) {
            setMessage({ type: 'danger', text: err.message });
        }
        setSaving(false);
    };

    const handleDelete = async (id, email) => {
        if (!window.confirm(`Remove user "${email}" from the system? This only removes their role — their Firebase Auth account remains.`)) return;
        try {
            await deleteDoc(doc(db, 'users', id));
            fetchUsers();
            setMessage({ type: 'success', text: `User ${email} removed from system.` });
        } catch (err) {
            setMessage({ type: 'danger', text: err.message });
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        setMessage({ type: '', text: '' });
        try {
            if (!tenantId) throw new Error("Tenant ID missing. Cannot create user.");
            const credential = await createUserWithEmailAndPassword(tempAuth, newEmail, newPassword);
            await setDoc(fsDoc(db, 'users', credential.user.uid), {
                email: newEmail,
                role: newRole,
                tenant_id: tenantId,
                createdAt: new Date()
            });
            await tempAuth.signOut();
            setMessage({ type: 'success', text: `✅ Created ${newRole} user: ${newEmail}` });
            setNewEmail(''); setNewPassword(''); setNewRole('staff');
            setShowCreate(false);
            fetchUsers();
        } catch (err) {
            setMessage({ type: 'danger', text: err.message });
        }
        setCreating(false);
    };

    return (
        <div>
            {message.text && (
                <div className={`notification is-${message.type} is-light mb-4`} style={{ borderRadius: '10px' }}>
                    <button className="delete" onClick={() => setMessage({ type: '', text: '' })}></button>
                    {message.text}
                </div>
            )}

            {/* ── Header row ── */}
            <div className="level mb-4">
                <div className="level-left">
                    <div>
                        <h3 className="title is-5 mb-0">
                            <span className="icon mr-2"><UsersGroupTwoRoundedBold size={20} /></span>
                            System Users
                        </h3>
                        <p className="has-text-grey is-size-7">Manage who can access this system and their permissions.</p>
                    </div>
                </div>
                <div className="level-right">
                    <button className="button is-primary" onClick={() => setShowCreate(s => !s)}>
                        <span className="icon"><UserPlusBold size={16} /></span>
                        <span>{showCreate ? 'Cancel' : 'Add New User'}</span>
                    </button>
                </div>
            </div>

            {/* ── Create form (collapsible) ── */}
            {showCreate && (
                <form onSubmit={handleCreate} className="box mb-5" style={{ background: '#f0fdf9', border: '2px solid #00b894' }}>
                    <h4 className="title is-6 mb-4">New System User</h4>
                    <div className="columns">
                        <div className="column">
                            <label className="label">Email</label>
                            <input className="input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required placeholder="user@bakery.com" />
                        </div>
                        <div className="column">
                            <label className="label">Temporary Password <span className="has-text-grey">(min 6 chars)</span></label>
                            <input className="input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength="6" placeholder="••••••••" />
                        </div>
                        <div className="column is-narrow">
                            <label className="label">Role</label>
                            <div className="select">
                                <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                                    <option value="staff">Staff</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <button className={`button is-primary ${creating ? 'is-loading' : ''}`} type="submit" disabled={creating}>
                        <span className="icon"><UserPlusBold size={16} /></span>
                        <span>Create User</span>
                    </button>
                </form>
            )}

            {/* ── Users table ── */}
            {loading ? (
                <div className="has-text-centered py-5"><span className="button is-loading is-white is-large"></span></div>
            ) : (
                <div className="table-container">
                    <table className="table is-fullwidth is-hoverable bl-table-responsive">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th style={{ width: '130px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 && (
                                <tr><td colSpan={4} className="has-text-centered has-text-grey py-5">No users found in Firestore.</td></tr>
                            )}
                            {users.map(u => (
                                editingId === u.id ? (
                                    <tr key={u.id} style={{ background: '#f0fdf9' }}>
                                        <td className="is-vcentered"><strong>{u.email}</strong></td>
                                        <td className="is-vcentered">
                                            <div className="select is-small">
                                                <select value={editRole} onChange={e => setEditRole(e.target.value)}>
                                                    <option value="staff">Staff</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="is-vcentered has-text-grey is-size-7">
                                            {u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            <div className="buttons are-small">
                                                <button className={`button is-success ${saving ? 'is-loading' : ''}`} onClick={() => handleSaveRole(u.id)} title="Save">
                                                    <span className="icon"><CheckSquareBold size={14} /></span>
                                                </button>
                                                <button className="button is-light" onClick={() => setEditingId(null)} title="Cancel">
                                                    <span className="icon"><CloseSquareBold size={14} /></span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={u.id}>
                                        <td data-label="Email" className="is-vcentered">
                                            <span className="icon mr-1 has-text-grey"><ShieldUserBold size={14} /></span>
                                            {u.email || <span className="has-text-grey">(UID: {u.id.substring(0, 12)}…)</span>}
                                        </td>
                                        <td data-label="Role" className="is-vcentered">
                                            <span className={`tag ${ROLE_COLORS[u.role] || 'is-light'}`}>
                                                {ROLE_LABELS[u.role] || u.role}
                                            </span>
                                        </td>
                                        <td data-label="Created" className="is-vcentered has-text-grey is-size-7">
                                            {u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '—'}
                                        </td>
                                        <td data-label="Actions" className="is-vcentered">
                                            <div className="buttons are-small">
                                                <button className="button is-info is-light" onClick={() => startEdit(u)} title="Change role">
                                                    <span className="icon"><PenNewSquareBold size={14} /></span>
                                                </button>
                                                <button className="button is-danger is-light" onClick={() => handleDelete(u.id, u.email)} title="Remove user">
                                                    <span className="icon"><TrashBinMinimalisticBold size={14} /></span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

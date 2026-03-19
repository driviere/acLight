import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTenant } from '../../contexts/TenantContext';
import { toDollarsData } from '../../utils/moneyUtils';

import { UsersGroupTwoRoundedBold, AddCircleBold, TrashBinMinimalisticBold, PenNewSquareBold, CheckSquareBold, CloseSquareBold, HistoryBold } from 'solar-icon-set';
import CustomerHistory from './CustomerHistory';


export default function CustomerManager() {
    const { tenantId } = useTenant();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    // Inline editing state
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [viewingHistory, setViewingHistory] = useState(null);


    const fetchCustomers = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            // 1. Fetch Customers
            const querySnapshot = await getDocs(collection(db, 'tenants', tenantId, 'customers'));
            const list = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // 2. Fetch Outstanding Journal Entries to calculate balances
            const q = query(
                collection(db, 'tenants', tenantId, 'journal_entries'),
                where('status', 'in', ['unpaid', 'partial'])
            );
            const journalsSnap = await getDocs(q);

            const balances = {}; // { customer_id: cents }
            journalsSnap.forEach(doc => {
                const data = doc.data();
                const custId = data.metadata?.customer_id;
                if (custId) {
                    balances[custId] = (balances[custId] || 0) + (data.outstanding_cents || 0);
                }
            });

            const enriched = list.map(c => ({
                ...c,
                balance_cents: balances[c.id] || 0
            }));

            setCustomers(enriched.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };


    useEffect(() => { fetchCustomers(); }, [tenantId]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!tenantId) return;
        try {
            await addDoc(collection(db, 'tenants', tenantId, 'customers'), { name, phone, email });
            setName(''); setPhone(''); setEmail('');
            fetchCustomers();
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this customer? Their existing invoices will remain.")) {
            await deleteDoc(doc(db, 'tenants', tenantId, 'customers', id));
            fetchCustomers();
        }
    };

    const startEdit = (c) => {
        setEditingId(c.id);
        setEditName(c.name || '');
        setEditPhone(c.phone || '');
        setEditEmail(c.email || '');
    };

    const cancelEdit = () => setEditingId(null);

    const handleSave = async (id) => {
        if (!editName.trim() || !tenantId) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'tenants', tenantId, 'customers', id), {
                name: editName.trim(),
                phone: editPhone.trim(),
                email: editEmail.trim(),
            });
            setEditingId(null);
            fetchCustomers();
        } catch (error) { console.error(error); }
        setSaving(false);
    };

    if (viewingHistory) {
        return <CustomerHistory customer={viewingHistory} onBack={() => setViewingHistory(null)} />;
    }

    return (
        <div className="box">

            <h2 className="title is-4 has-text-info">
                <span className="icon mr-2"><UsersGroupTwoRoundedBold size={24} /></span>
                Customer Accounts (AR)
            </h2>

            {/* ── Add Form ── */}
            <form onSubmit={handleAdd} className="mb-5 p-4 has-background-white-ter" style={{ borderRadius: '8px' }}>
                <div className="columns is-multiline">
                    <div className="column is-4">
                        <label className="label">Business / Customer Name</label>
                        <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Smith's Café" />
                    </div>
                    <div className="column is-4">
                        <label className="label">Phone <span className="has-text-grey">(optional)</span></label>
                        <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 555-1234" />
                    </div>
                    <div className="column is-4">
                        <label className="label">Email <span className="has-text-grey">(optional)</span></label>
                        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. billing@company.com" />
                    </div>
                    <div className="column is-12">
                        <button className="button is-info" type="submit">
                            <span className="icon"><AddCircleBold /></span>
                            <span>Add Customer</span>
                        </button>
                    </div>
                </div>
            </form>

            {/* ── Table ── */}
            {loading ? <p>Loading...</p> : (
                <div className="table-container">
                    <table className="table is-fullwidth is-hoverable bl-table-responsive">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th className="has-text-right">Balance</th>
                                <th style={{ width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 && (
                                <tr><td colSpan={4} className="has-text-grey has-text-centered py-4">No customers yet.</td></tr>
                            )}
                            {customers.map(c => (
                                editingId === c.id ? (
                                    // ── Edit Row ──
                                    <tr key={c.id} style={{ background: '#f0fdf9' }}>
                                        <td>
                                            <input
                                                className="input is-small"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                required
                                                autoFocus
                                            />
                                        </td>
                                        <td>
                                            <input
                                                className="input is-small"
                                                value={editPhone}
                                                onChange={e => setEditPhone(e.target.value)}
                                                placeholder="Phone"
                                            />
                                        </td>
                                        <td className="has-text-right is-vcentered">
                                            <span className="is-size-7 has-text-grey">
                                                ${toDollarsData(c.balance_cents)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="buttons are-small">
                                                <button
                                                    className={`button is-success ${saving ? 'is-loading' : ''}`}
                                                    onClick={() => handleSave(c.id)}
                                                    disabled={saving || !editName.trim()}
                                                    title="Save"
                                                >
                                                    <span className="icon"><CheckSquareBold size={14} /></span>
                                                </button>
                                                <button className="button is-light" onClick={cancelEdit} title="Cancel">
                                                    <span className="icon"><CloseSquareBold size={14} /></span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    // ── Read Row ──
                                    <tr key={c.id}>
                                        <td data-label="Name" className="is-vcentered"><strong>{c.name}</strong></td>
                                        <td data-label="Phone" className="is-vcentered">{c.phone || <span className="has-text-grey-light">—</span>}</td>
                                        <td data-label="Balance" className="has-text-right is-vcentered">
                                            {c.balance_cents > 0 ? (
                                                <span className="has-text-danger has-text-weight-bold">
                                                    ${toDollarsData(c.balance_cents)}
                                                </span>
                                            ) : (
                                                <span className="has-text-success">$0.00</span>
                                            )}
                                        </td>
                                        <td data-label="Actions" className="is-vcentered">
                                            <div className="buttons are-small">
                                                <button
                                                    className="button is-link is-light"
                                                    onClick={() => setViewingHistory(c)}
                                                    title="View history"
                                                >
                                                    <span className="icon"><HistoryBold size={14} /></span>
                                                </button>
                                                <button
                                                    className="button is-info is-light"
                                                    onClick={() => startEdit(c)}
                                                    title="Edit customer"
                                                >
                                                    <span className="icon"><PenNewSquareBold size={14} /></span>
                                                </button>

                                                <button
                                                    className="button is-danger is-light"
                                                    onClick={() => handleDelete(c.id)}
                                                    title="Delete customer"
                                                >
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

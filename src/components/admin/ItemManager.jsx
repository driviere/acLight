import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toDollarsData, toCents } from '../../utils/moneyUtils';
import { useTenant } from '../../contexts/TenantContext';
import { getAllAccounts } from '../../services/accountService';
import { BoxBold, AddCircleBold, TrashBinMinimalisticBold, PenBold } from 'solar-icon-set';

export default function ItemManager() {
    const { tenantId } = useTenant();
    const [items, setItems] = useState([]);
    const [revenueAccounts, setRevenueAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [sku, setSku] = useState('');
    const [revenueAccount, setRevenueAccount] = useState('4000_revenue');
    const [isQuickAccess, setIsQuickAccess] = useState(false);

    // Editing state
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [savingId, setSavingId] = useState(null);

    const fetchItems = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'tenants', tenantId, 'items'));
            const itemsList = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(item => item.type !== 'bundle'); // Filter out bundles
            setItems(itemsList.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!tenantId) return;
        fetchItems();
        // Fetch revenue accounts for the dropdown
        getAllAccounts(tenantId).then(all => {
            setRevenueAccounts(all.filter(a => a.type === 'revenue' && a.active !== false));
        });
    }, [tenantId]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!tenantId) return;
        try {
            await addDoc(collection(db, 'tenants', tenantId, 'items'), {
                name,
                price_cents: toCents(price),
                sku: sku || name.substring(0, 4).toUpperCase(),
                revenue_account: revenueAccount || '4000_revenue',
                is_quick_access: isQuickAccess
            });
            setName('');
            setPrice('');
            setSku('');
            setRevenueAccount('4000_revenue');
            setIsQuickAccess(false);
            fetchItems();
        } catch (error) {
            console.error(error);
            alert("Error adding item");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this specific SKU?")) {
            await deleteDoc(doc(db, 'tenants', tenantId, 'items', id));
            fetchItems();
        }
    };

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setEditForm({
            name: item.name,
            sku: item.sku || '',
            price: (item.price_cents / 100).toFixed(2),
            revenue_account: item.revenue_account || '4000_revenue',
            is_quick_access: item.is_quick_access || false
        });
    };

    const handleSaveEdit = async () => {
        if (!editForm.name || !editForm.price || !tenantId) return;
        setSavingId(editingId);
        try {
            await updateDoc(doc(db, 'tenants', tenantId, 'items', editingId), {
                name: editForm.name,
                sku: editForm.sku,
                price_cents: toCents(editForm.price),
                revenue_account: editForm.revenue_account,
                is_quick_access: editForm.is_quick_access
            });
            setEditingId(null);
            fetchItems();
        } catch (err) {
            console.error(err);
            alert("Error saving item");
        }
        setSavingId(null);
    };

    return (
        <div className="box">
            <h2 className="title is-4 has-text-primary">
                <span className="icon mr-2"><BoxBold size={24} /></span>
                Inventory & POS Items
            </h2>

            <form onSubmit={handleAdd} className="mb-5 p-4 has-background-white-ter" style={{ borderRadius: '8px' }}>
                <div className="columns is-multiline">
                    <div className="column is-4">
                        <label className="label">Item Name</label>
                        <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. White Mastiff" />
                    </div>
                    <div className="column is-3">
                        <label className="label">Price ($)</label>
                        <input className="input" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} required placeholder="e.g. 5.50" />
                    </div>
                    <div className="column is-3">
                        <label className="label">SKU (Opt)</label>
                        <input className="input" value={sku} onChange={e => setSku(e.target.value)} placeholder="WHT-MSTF" />
                    </div>
                    <div className="column is-3">
                        <label className="label">Revenue Account</label>
                        <div className="select is-fullwidth">
                            <select value={revenueAccount} onChange={e => setRevenueAccount(e.target.value)}>
                                {revenueAccounts.length === 0
                                    ? <option value="4000_revenue">4000_revenue (default)</option>
                                    : revenueAccounts.map(a => (
                                        <option key={a.id} value={a.id}>{a.id} — {a.name}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                    <div className="column is-2 is-flex is-align-items-flex-end">
                        <label className="checkbox mb-2">
                            <input type="checkbox" checked={isQuickAccess} onChange={e => setIsQuickAccess(e.target.checked)} className="mr-2" />
                            <strong>POS Big Button</strong>
                        </label>
                    </div>
                    <div className="column is-12">
                        <button className="button is-primary" type="submit">
                            <span className="icon"><AddCircleBold /></span>
                            <span>Add New Item</span>
                        </button>
                    </div>
                </div>
            </form>

            {loading ? <p>Loading items...</p> : (
                <div className="table-container">
                    <table className="table is-fullwidth is-hoverable is-striped bl-table-responsive">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>SKU</th>
                                <th>Price</th>
                                <th>Revenue Account</th>
                                <th>Quick Access</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id}>
                                    {editingId === item.id ? (
                                        <>
                                            <td><input className="input is-small" value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} /></td>
                                            <td><input className="input is-small" value={editForm.sku} onChange={e => setEditForm(prev => ({ ...prev, sku: e.target.value }))} /></td>
                                            <td><input className="input is-small" type="number" step="0.01" value={editForm.price} onChange={e => setEditForm(prev => ({ ...prev, price: e.target.value }))} /></td>
                                            <td>
                                                <div className="select is-small is-fullwidth">
                                                    <select value={editForm.revenue_account} onChange={e => setEditForm(prev => ({ ...prev, revenue_account: e.target.value }))}>
                                                        {revenueAccounts.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
                                                    </select>
                                                </div>
                                            </td>
                                            <td><input type="checkbox" checked={editForm.is_quick_access} onChange={e => setEditForm(prev => ({ ...prev, is_quick_access: e.target.checked }))} /></td>
                                            <td>
                                                <div className="buttons are-small">
                                                    <button className={`button is-success ${savingId === item.id ? 'is-loading' : ''}`} onClick={handleSaveEdit}>Save</button>
                                                    <button className="button is-light" onClick={() => setEditingId(null)}>Cancel</button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td data-label="Name">{item.name}</td>
                                            <td data-label="SKU">{item.sku}</td>
                                            <td data-label="Price">${toDollarsData(item.price_cents)}</td>
                                            <td data-label="Account" className="is-size-7 has-text-grey">{item.revenue_account || '4000_revenue'}</td>
                                            <td data-label="Quick Access">{item.is_quick_access ? <span className="tag is-success">Yes</span> : <span className="tag is-light">No</span>}</td>
                                            <td data-label="Actions">
                                                <div className="buttons are-small">
                                                    <button className="button is-info is-small is-light" onClick={() => handleEditClick(item)}>
                                                        <span className="icon"><PenBold size={14} /></span>
                                                    </button>
                                                    <button className="button is-danger is-small is-light" onClick={() => handleDelete(item.id)}>
                                                        <span className="icon"><TrashBinMinimalisticBold size={14} /></span>
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

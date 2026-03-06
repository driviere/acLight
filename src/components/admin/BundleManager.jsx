import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toDollarsData, toCents } from '../../utils/moneyUtils';
import { useTenant } from '../../contexts/TenantContext';
import { getAllAccounts } from '../../services/accountService';
import { LayersBold, AddCircleBold, TrashBinMinimalisticBold, PenBold } from 'solar-icon-set';
import Select from 'react-select';

export default function BundleManager() {
    const { tenantId } = useTenant();
    const [bundles, setBundles] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [revenueAccounts, setRevenueAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [sku, setSku] = useState('');
    const [revenueAccount, setRevenueAccount] = useState('4000_revenue');
    const [isQuickAccess, setIsQuickAccess] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]); // [{ item_id, item_name, quantity }]

    // Editing state
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [savingId, setSavingId] = useState(null);

    const fetchData = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'tenants', tenantId, 'items'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const itemsList = data.filter(item => item.type !== 'bundle');
            setAllItems(itemsList.sort((a, b) => a.name.localeCompare(b.name)));

            const bundleList = data.filter(item => item.type === 'bundle');
            setBundles(bundleList.sort((a, b) => a.name.localeCompare(b.name)));

            const accounts = await getAllAccounts(tenantId);
            setRevenueAccounts(accounts.filter(a => a.type === 'revenue' && a.active !== false));
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [tenantId]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (selectedItems.length === 0 || !tenantId) {
            alert("A bundle must contain at least one item.");
            return;
        }

        try {
            await addDoc(collection(db, 'tenants', tenantId, 'items'), {
                type: 'bundle',
                name,
                price_cents: toCents(price),
                sku: sku || name.substring(0, 4).toUpperCase(),
                revenue_account: revenueAccount || '4000_revenue',
                is_quick_access: isQuickAccess,
                bundle_items: selectedItems
            });
            setName('');
            setPrice('');
            setSku('');
            setRevenueAccount('4000_revenue');
            setIsQuickAccess(false);
            setSelectedItems([]);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Error adding bundle");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this bundle?")) {
            await deleteDoc(doc(db, 'tenants', tenantId, 'items', id));
            fetchData();
        }
    };

    const handleEditClick = (bundle) => {
        setEditingId(bundle.id);
        setEditForm({
            name: bundle.name,
            sku: bundle.sku || '',
            price: (bundle.price_cents / 100).toFixed(2),
            revenue_account: bundle.revenue_account || '4000_revenue',
            is_quick_access: bundle.is_quick_access || false,
            bundle_items: bundle.bundle_items || []
        });
    };

    const handleSaveEdit = async () => {
        if (!editForm.name || !editForm.price || editForm.bundle_items.length === 0 || !tenantId) return;
        setSavingId(editingId);
        try {
            await updateDoc(doc(db, 'tenants', tenantId, 'items', editingId), {
                name: editForm.name,
                sku: editForm.sku,
                price_cents: toCents(editForm.price),
                revenue_account: editForm.revenue_account,
                is_quick_access: editForm.is_quick_access,
                bundle_items: editForm.bundle_items
            });
            setEditingId(null);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error saving bundle");
        }
        setSavingId(null);
    };

    const itemOptions = allItems.map(i => ({ value: i.id, label: i.name }));

    const handleMultiSelectChange = (selectedOptions) => {
        // Map react-select options back to our bundle_items format, preserving existing quantites
        const newSelected = selectedOptions.map(opt => {
            const existing = selectedItems.find(si => si.item_id === opt.value);
            return existing ? existing : { item_id: opt.value, item_name: opt.label, quantity: 1 };
        });
        setSelectedItems(newSelected);
    };

    const handleEditMultiSelectChange = (selectedOptions) => {
        const newSelected = selectedOptions.map(opt => {
            const existing = editForm.bundle_items.find(si => si.item_id === opt.value);
            return existing ? existing : { item_id: opt.value, item_name: opt.label, quantity: 1 };
        });
        setEditForm(prev => ({ ...prev, bundle_items: newSelected }));
    };

    const updateQuantity = (itemId, change, isEditMode = false) => {
        const target = isEditMode ? editForm.bundle_items : selectedItems;
        const setter = isEditMode ? (items) => setEditForm(prev => ({ ...prev, bundle_items: items })) : setSelectedItems;

        const updated = target.map(i => {
            if (i.item_id === itemId) {
                return { ...i, quantity: Math.max(1, i.quantity + change) };
            }
            return i;
        });
        setter(updated);
    };

    return (
        <div className="box">
            <h2 className="title is-4" style={{ color: '#805ad5' }}>
                <span className="icon mr-2"><LayersBold size={24} /></span>
                Promos & Bundles
            </h2>
            <p className="subtitle is-6 mb-5">Create package deals and combos. These appear alongside regular items in the POS.</p>

            <form onSubmit={handleAdd} className="mb-5 p-4 has-background-white-ter" style={{ borderRadius: '8px' }}>
                <div className="columns is-multiline">
                    <div className="column is-4">
                        <label className="label">Bundle Name</label>
                        <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Breakfast Combo" />
                    </div>
                    <div className="column is-2">
                        <label className="label">Bundle Price ($)</label>
                        <input className="input" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} required placeholder="e.g. 10.00" />
                    </div>
                    <div className="column is-3">
                        <label className="label">Revenue Account</label>
                        <div className="select is-fullwidth">
                            <select value={revenueAccount} onChange={e => setRevenueAccount(e.target.value)}>
                                {revenueAccounts.length === 0 ? <option value="4000_revenue">4000_revenue</option> : revenueAccounts.map(a => <option key={a.id} value={a.id}>{a.id} — {a.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="column is-3">
                        <label className="label">SKU (Opt)</label>
                        <input className="input" value={sku} onChange={e => setSku(e.target.value)} placeholder="CMBO-01" />
                    </div>

                    <div className="column is-10">
                        <label className="label">Items Included</label>
                        <Select
                            isMulti
                            options={itemOptions}
                            value={selectedItems.map(si => ({ value: si.item_id, label: si.item_name }))}
                            onChange={handleMultiSelectChange}
                            placeholder="Select items to include in this bundle..."
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    fontSize: 'var(--bl-input-font-size, 1rem)'
                                }),
                                placeholder: (base) => ({
                                    ...base,
                                    fontSize: 'var(--bl-input-font-size, 1rem)'
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    fontSize: 'var(--bl-input-font-size, 1rem)'
                                }),
                                multiValue: (base) => ({
                                    ...base,
                                    fontSize: '0.85rem'
                                })
                            }}
                        />
                        {selectedItems.length > 0 && (
                            <div className="tags mt-2">
                                {selectedItems.map(si => (
                                    <span key={si.item_id} className="tag is-primary is-light is-medium">
                                        <button type="button" className="button is-small is-ghost px-1" onClick={() => updateQuantity(si.item_id, -1)} disabled={si.quantity <= 1}>-</button>
                                        <strong className="px-2">{si.quantity}x</strong> {si.item_name}
                                        <button type="button" className="button is-small is-ghost px-1" onClick={() => updateQuantity(si.item_id, 1)}>+</button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="column is-2 is-flex is-flex-direction-column is-justify-content-flex-end">
                        <label className="checkbox mb-2 is-size-7">
                            <input type="checkbox" checked={isQuickAccess} onChange={e => setIsQuickAccess(e.target.checked)} className="mr-1" />
                            <strong>POS Big Button</strong>
                        </label>
                        <button className="button is-primary is-fullwidth" type="submit" style={{ backgroundColor: '#805ad5' }}>
                            <span className="icon"><AddCircleBold /></span>
                            <span>Create Bundle</span>
                        </button>
                    </div>
                </div>
            </form>

            {loading ? <p>Loading bundles...</p> : (
                <div className="table-container">
                    <table className="table is-fullwidth is-hoverable is-striped bl-table-responsive">
                        <thead>
                            <tr>
                                <th>Bundle Name</th>
                                <th>Items Included</th>
                                <th>Price</th>
                                <th>Access</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bundles.map(bundle => (
                                <tr key={bundle.id}>
                                    {editingId === bundle.id ? (
                                        <>
                                            <td>
                                                <input className="input is-small mb-2" value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
                                                <input className="input is-small" placeholder="SKU" value={editForm.sku} onChange={e => setEditForm(prev => ({ ...prev, sku: e.target.value }))} />
                                            </td>
                                            <td>
                                                <Select
                                                    isMulti
                                                    styles={{
                                                        control: base => ({
                                                            ...base,
                                                            minHeight: '30px',
                                                            fontSize: 'var(--bl-input-font-size, 0.85rem)'
                                                        }),
                                                        valueContainer: base => ({ ...base, padding: '0 8px' }),
                                                        placeholder: base => ({ ...base, fontSize: 'var(--bl-input-font-size, 0.85rem)' }),
                                                        multiValue: base => ({ ...base, fontSize: '0.75rem' })
                                                    }}
                                                    options={itemOptions}
                                                    value={editForm.bundle_items.map(si => ({ value: si.item_id, label: si.item_name }))}
                                                    onChange={handleEditMultiSelectChange}
                                                />
                                                <div className="tags mt-1">
                                                    {editForm.bundle_items.map(si => (
                                                        <span key={si.item_id} className="tag is-primary is-light" style={{ fontSize: '0.65rem' }}>
                                                            <a onClick={() => updateQuantity(si.item_id, -1, true)} className="has-text-grey mr-1">-</a>
                                                            <strong>{si.quantity}x</strong> {si.item_name}
                                                            <a onClick={() => updateQuantity(si.item_id, 1, true)} className="has-text-grey ml-1">+</a>
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <input className="input is-small" type="number" step="0.01" value={editForm.price} onChange={e => setEditForm(prev => ({ ...prev, price: e.target.value }))} />
                                                <div className="select is-small mt-2 is-fullwidth">
                                                    <select value={editForm.revenue_account} onChange={e => setEditForm(prev => ({ ...prev, revenue_account: e.target.value }))}>
                                                        {revenueAccounts.map(a => <option key={a.id} value={a.id}>{a.id}</option>)}
                                                    </select>
                                                </div>
                                            </td>
                                            <td><input type="checkbox" checked={editForm.is_quick_access} onChange={e => setEditForm(prev => ({ ...prev, is_quick_access: e.target.checked }))} /> POS</td>
                                            <td>
                                                <div className="buttons are-small">
                                                    <button className={`button is-success ${savingId === bundle.id ? 'is-loading' : ''}`} onClick={handleSaveEdit}>Save</button>
                                                    <button className="button is-light" onClick={() => setEditingId(null)}>Cancel</button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td data-label="Bundle Name">
                                                <strong>{bundle.name}</strong><br />
                                                <span className="is-size-7 has-text-grey">{bundle.sku}</span>
                                            </td>
                                            <td data-label="Items Included">
                                                <div className="tags">
                                                    {bundle.bundle_items?.map((bi, i) => (
                                                        <span key={i} className="tag is-light is-info"><strong>{bi.quantity}x</strong>&nbsp;{bi.item_name}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td data-label="Price">
                                                <strong>${toDollarsData(bundle.price_cents)}</strong><br />
                                                <span className="is-size-7 has-text-grey">{bundle.revenue_account}</span>
                                            </td>
                                            <td data-label="Quick Access">{bundle.is_quick_access ? <span className="tag is-success">Yes</span> : <span className="tag is-light">No</span>}</td>
                                            <td data-label="Actions">
                                                <div className="buttons are-small">
                                                    <button className="button is-info is-small is-light" onClick={() => handleEditClick(bundle)}>
                                                        <span className="icon"><PenBold size={14} /></span>
                                                    </button>
                                                    <button className="button is-danger is-small is-light" onClick={() => handleDelete(bundle.id)}>
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

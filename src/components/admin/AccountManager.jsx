import React, { useState, useEffect } from 'react';
import { getAllAccounts, addAccount, updateAccount } from '../../services/accountService';
import { toDollarsData } from '../../utils/moneyUtils';
import { ChartBold, AddCircleBold, PenBold, CheckSquareBold, CloseSquareBold } from 'solar-icon-set';

const TYPE_ORDER = ['asset', 'liability', 'equity', 'revenue', 'expense'];
const TYPE_COLORS = {
    asset: 'is-info is-light',
    liability: 'is-danger is-light',
    equity: 'is-warning is-light',
    revenue: 'is-success is-light',
    expense: 'is-dark is-light',
};
const TYPE_LABELS = {
    asset: 'Asset',
    liability: 'Liability',
    equity: 'Equity',
    revenue: 'Revenue',
    expense: 'Expense',
};

export default function AccountManager() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // New account form state
    const [newId, setNewId] = useState('');
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('revenue');
    const [adding, setAdding] = useState(false);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            setAccounts(await getAllAccounts());
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => { fetchAccounts(); }, []);

    const handleEdit = (account) => {
        setEditingId(account.id);
        setEditName(account.name);
        setError('');
    };

    const handleSaveEdit = async (id) => {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            await updateAccount(id, { name: editName.trim() });
            setEditingId(null);
            fetchAccounts();
        } catch (e) {
            setError(e.message);
        }
        setSaving(false);
    };

    const handleToggleActive = async (account) => {
        const currentlyActive = account.active !== false; // default true if missing
        if (!currentlyActive || window.confirm(`Reactivate "${account.name}"?`) || currentlyActive && window.confirm(`Deactivate "${account.name}"? It will be hidden from dropdowns but history is preserved.`)) {
            await updateAccount(account.id, { active: !currentlyActive });
            fetchAccounts();
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setAdding(true);
        setError('');
        try {
            await addAccount(newId, newName, newType);
            setNewId('');
            setNewName('');
            setNewType('revenue');
            fetchAccounts();
        } catch (e) {
            setError(e.message);
        }
        setAdding(false);
    };

    // Group accounts by type
    const grouped = TYPE_ORDER.reduce((acc, type) => {
        acc[type] = accounts.filter(a => a.type === type);
        return acc;
    }, {});

    return (
        <div className="box">
            <h2 className="title is-4" style={{ color: '#1a202c' }}>
                <span className="icon mr-2"><ChartBold size={24} /></span>
                Chart of Accounts
            </h2>
            <p className="subtitle is-6 mb-5">Manage the accounts used for double-entry bookkeeping. Add custom accounts or deactivate ones you don't need.</p>

            {error && <div className="notification is-danger is-light mb-4">{error}</div>}

            {/* Add Account Form */}
            <form onSubmit={handleAdd} className="p-4 mb-5 has-background-white-ter" style={{ borderRadius: '8px' }}>
                <p className="label mb-3">Add New Account</p>
                <div className="columns is-multiline">
                    <div className="column is-3">
                        <label className="label is-small">Account ID</label>
                        <input
                            className="input is-small"
                            placeholder="e.g. 4200_catering"
                            value={newId}
                            onChange={e => setNewId(e.target.value)}
                            required
                        />
                        <p className="help">Lowercase, use underscores</p>
                    </div>
                    <div className="column is-4">
                        <label className="label is-small">Account Name</label>
                        <input
                            className="input is-small"
                            placeholder="e.g. Catering Revenue"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="column is-3">
                        <label className="label is-small">Type</label>
                        <div className="select is-small is-fullwidth">
                            <select value={newType} onChange={e => setNewType(e.target.value)}>
                                {TYPE_ORDER.map(t => (
                                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="column is-2 is-flex is-align-items-flex-end">
                        <button className={`button is-primary is-small is-fullwidth ${adding ? 'is-loading' : ''}`} type="submit" disabled={adding}>
                            <span className="icon"><AddCircleBold size={14} /></span>
                            <span>Add</span>
                        </button>
                    </div>
                </div>
            </form>

            {/* Accounts Table grouped by type */}
            {loading ? <p>Loading accounts...</p> : (
                TYPE_ORDER.map(type => (
                    grouped[type].length > 0 && (
                        <div key={type} className="mb-5">
                            <p className="has-text-weight-bold is-size-7 mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: '#718096' }}>
                                {TYPE_LABELS[type]}s
                            </p>
                            <table className="table is-fullwidth is-hoverable is-narrow">
                                <thead>
                                    <tr>
                                        <th style={{ width: '180px' }}>ID</th>
                                        <th>Name</th>
                                        <th className="has-text-right" style={{ width: '130px' }}>Balance</th>
                                        <th style={{ width: '80px' }}>Status</th>
                                        <th style={{ width: '100px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grouped[type].map(account => {
                                        const isActive = account.active !== false;
                                        return (
                                            <tr key={account.id} style={{ opacity: isActive ? 1 : 0.45 }}>
                                                <td className="is-size-7 is-vcentered" style={{ fontFamily: 'monospace' }}>{account.id}</td>
                                                <td className="is-vcentered">
                                                    {editingId === account.id ? (
                                                        <div className="field has-addons mb-0">
                                                            <div className="control is-expanded">
                                                                <input
                                                                    className="input is-small"
                                                                    value={editName}
                                                                    onChange={e => setEditName(e.target.value)}
                                                                    autoFocus
                                                                />
                                                            </div>
                                                            <div className="control">
                                                                <button className={`button is-small is-success ${saving ? 'is-loading' : ''}`} onClick={() => handleSaveEdit(account.id)}>
                                                                    <CheckSquareBold size={13} />
                                                                </button>
                                                            </div>
                                                            <div className="control">
                                                                <button className="button is-small is-light" onClick={() => setEditingId(null)}>
                                                                    <CloseSquareBold size={13} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="is-size-7">{account.name}</span>
                                                    )}
                                                </td>
                                                <td className="has-text-right is-vcentered is-size-7">
                                                    <span className={account.balance < 0 ? 'has-text-danger' : ''}>
                                                        ${toDollarsData(account.balance || 0)}
                                                    </span>
                                                </td>
                                                <td className="is-vcentered">
                                                    <span className={`tag is-small ${isActive ? TYPE_COLORS[type] : 'is-light'}`}>
                                                        {isActive ? TYPE_LABELS[type] : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="is-vcentered">
                                                    <div className="buttons are-small">
                                                        <button className="button is-info is-light is-small" onClick={() => handleEdit(account)} disabled={!isActive}>
                                                            <PenBold size={11} />
                                                        </button>
                                                        <button
                                                            className={`button is-small ${isActive ? 'is-danger is-light' : 'is-success is-light'}`}
                                                            onClick={() => handleToggleActive(account)}
                                                            title={isActive ? 'Deactivate' : 'Reactivate'}
                                                        >
                                                            {isActive ? <CloseSquareBold size={11} /> : <CheckSquareBold size={11} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                ))
            )}
        </div>
    );
}

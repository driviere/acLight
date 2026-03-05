import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { toDollarsData } from '../../utils/moneyUtils';
import { voidJournalEntry } from '../../services/journalService';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader } from '../../App';
import { BookmarkBold, DocumentTextBold, NotesBold, CheckSquareBold, CloseSquareBold, TrashBinTrashBold } from 'solar-icon-set';

const TYPE_LABELS = {
    sale: 'Sale (Legacy)',
    cash_sale: 'Cash Sale',
    credit_sale: 'Credit Invoice',
    purchase: 'Purchase',
    expense: 'Expense',
    waste: 'Waste/Spoilage',
    payment: 'Payment Received',
    payment_sent: 'Payment Sent',
};

const STATUS_BADGE = {
    paid: { cls: 'is-success is-light', label: 'Paid' },
    unpaid: { cls: 'is-warning is-light', label: 'Unpaid' },
    partial: { cls: 'is-info is-light', label: 'Partial' },
    void: { cls: 'is-danger is-light', label: 'Void' },
};

const TYPE_BADGE = {
    sale: 'is-success',
    cash_sale: 'is-success',
    credit_sale: 'is-link is-light',
    purchase: 'is-danger',
    expense: 'is-warning',
    waste: 'is-light',
    payment: 'is-primary',
    payment_sent: 'is-info',
};

function ReferenceEditor({ entry, onSaved }) {
    const [ref, setRef] = useState(entry.metadata?.refNo || entry.metadata?.reference || '');
    const [notes, setNotes] = useState(entry.metadata?.notes || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateDoc(doc(db, 'journal_entries', entry.id), {
                'metadata.refNo': ref.trim(),
                'metadata.notes': notes.trim(),
            });
            onSaved();
        } catch (err) {
            console.error(err);
        }
        setSaving(false);
    };

    return (
        <div className="box mt-2" style={{ background: '#f8faff', border: '1px solid #dbeafe' }}>
            <p className="has-text-weight-bold mb-3 is-size-7 has-text-info" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📎 Attach Reference / Notes
            </p>
            <div className="columns is-mobile">
                <div className="column is-5">
                    <label className="label is-small">Cheque / Invoice / Receipt No.</label>
                    <input
                        className="input is-small"
                        value={ref}
                        onChange={e => setRef(e.target.value)}
                        placeholder="e.g. CHQ-1042 or INV-2024-001"
                    />
                </div>
                <div className="column">
                    <label className="label is-small">Notes</label>
                    <input
                        className="input is-small"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Optional note..."
                    />
                </div>
                <div className="column is-narrow" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button className={`button is-primary is-small ${saving ? 'is-loading' : ''}`} onClick={handleSave} disabled={saving}>
                        <span className="icon"><CheckSquareBold size={13} /></span>
                        <span>Save</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TransactionLedger() {
    const { currentUser } = useAuth();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [editingRefId, setEditingRefId] = useState(null);
    const [voidTarget, setVoidTarget] = useState(null);
    const [voiding, setVoiding] = useState(false);

    // Filters
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'journal_entries'), orderBy('date', 'desc'));
            const snap = await getDocs(q);
            setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Error fetching ledger:', err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchEntries(); }, []);

    const filtered = entries.filter(e => {
        if (filterType !== 'all' && e.type !== filterType) return false;
        if (filterStatus !== 'all' && e.status !== filterStatus) return false;
        if (search) {
            const s = search.toLowerCase();
            const meta = e.metadata || {};
            return (
                (meta.customer_name || '').toLowerCase().includes(s) ||
                (meta.vendor_name || '').toLowerCase().includes(s) ||
                (meta.refNo || '').toLowerCase().includes(s) ||
                (meta.notes || '').toLowerCase().includes(s) ||
                (meta.items_summary || '').toLowerCase().includes(s) ||
                (e.reference || '').toLowerCase().includes(s)
            );
        }
        return true;
    });

    const totalSales = filtered.filter(e => ['sale', 'cash_sale', 'credit_sale'].includes(e.type)).reduce((s, e) => s + (e.total_cents || 0), 0);
    const totalPayments = filtered.filter(e => e.type === 'payment' || e.type === 'payment_received').reduce((s, e) => s + (e.total_cents || 0), 0);

    // Cash that actually came in: cash sales + payments received
    // Legacy 'sale' type is excluded as it's ambiguous (could be cash or credit).
    const totalCashIn = filtered
        .filter(e => ['cash_sale', 'payment', 'payment_received'].includes(e.type))
        .reduce((s, e) => s + (e.total_cents || 0), 0);

    const toggleExpand = (id) => {
        setExpandedId(prev => prev === id ? null : id);
        setEditingRefId(null);
    };

    if (loading) return (
        <div className="has-text-centered" style={{ padding: '5rem' }}>
            <span className="button is-loading is-white is-large"></span>
            <p className="mt-3 has-text-grey">Loading transactions...</p>
        </div>
    );

    return (
        <div>
            <PageHeader
                title="Transaction Ledger"
                subtitle="Full history of all sales, purchases, expenses, and payments."
                icon={<BookmarkBold size={24} />}
            />

            {/* ── Filters ── */}
            <div className="box mb-4" style={{ padding: '1rem' }}>
                <div className="columns is-mobile is-vcentered">
                    <div className="column">
                        <input
                            className="input"
                            placeholder="🔍 Search customer, vendor, reference..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="column is-narrow">
                        <div className="select">
                            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                                <option value="all">All Types</option>
                                <option value="sale">Sales</option>
                                <option value="purchase">Purchases</option>
                                <option value="expense">Expenses</option>
                                <option value="waste">Waste</option>
                            </select>
                        </div>
                    </div>
                    <div className="column is-narrow">
                        <div className="select">
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="all">All Statuses</option>
                                <option value="paid">Cash / Paid</option>
                                <option value="unpaid">On Credit</option>
                                <option value="partial">Partial</option>
                            </select>
                        </div>
                    </div>
                </div>
                <p className="has-text-grey is-size-7 mt-1">
                    Showing <strong>{filtered.length}</strong> of {entries.length} transactions
                    {filterType !== 'all' || filterStatus !== 'all' ? ' (filtered)' : ''}
                    {' '} | Sales: <strong className="has-text-success">${toDollarsData(totalSales)}</strong>
                    {' '} | Payments: <strong className="has-text-info">${toDollarsData(totalPayments)}</strong>
                </p>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-emoji">📋</span>
                    <p className="empty-title">No transactions found</p>
                    <p className="empty-subtitle">Try adjusting your filters.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table is-fullwidth is-hoverable">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Party / Description</th>
                                <th>Status</th>
                                <th className="has-text-right">Amount</th>
                                <th className="has-text-right">Outstanding</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(entry => {
                                const dateStr = entry.date?.seconds
                                    ? new Date(entry.date.seconds * 1000).toLocaleDateString()
                                    : '—';
                                const meta = entry.metadata || {};
                                const party = meta.customer_name || meta.vendor_name || meta.description || '—';
                                const statusBadge = STATUS_BADGE[entry.status] || { cls: 'is-light', label: entry.status };
                                const typeBadge = TYPE_BADGE[entry.type] || 'is-light';
                                const isExpanded = expandedId === entry.id;
                                const hasRef = meta.refNo || meta.notes;

                                return (
                                    <React.Fragment key={entry.id}>
                                        <tr
                                            style={{
                                                cursor: 'pointer',
                                                ...(entry.status === 'void' ? { opacity: 0.45, textDecoration: 'line-through' } : {})
                                            }}
                                            onClick={() => toggleExpand(entry.id)}
                                            className={isExpanded ? 'has-background-light' : ''}
                                        >
                                            <td className="is-vcentered" style={{ whiteSpace: 'nowrap' }}>{dateStr}</td>
                                            <td className="is-vcentered">
                                                <span className={`tag ${typeBadge}`}>
                                                    {TYPE_LABELS[entry.type] || entry.type}
                                                </span>
                                            </td>
                                            <td className="is-vcentered">
                                                <strong>{party}</strong>
                                                {meta.items_summary && <><br /><span className="has-text-grey is-size-7">{meta.items_summary}</span></>}
                                                {hasRef && <><br /><span className="has-text-info is-size-7">📎 {meta.refNo}{meta.notes ? ` — ${meta.notes}` : ''}</span></>}
                                            </td>
                                            <td className="is-vcentered">
                                                <span className={`tag ${statusBadge.cls}`}>{statusBadge.label}</span>
                                            </td>
                                            <td className="has-text-right is-vcentered has-text-weight-bold">
                                                ${toDollarsData(entry.total_cents || 0)}
                                            </td>
                                            <td className="has-text-right is-vcentered">
                                                {entry.outstanding_cents > 0
                                                    ? <span className="has-text-danger has-text-weight-bold">${toDollarsData(entry.outstanding_cents)}</span>
                                                    : <span className="has-text-success">✓</span>}
                                            </td>
                                            <td className="has-text-centered is-vcentered">
                                                <span className="has-text-grey is-size-7">{isExpanded ? '▲' : '▼'}</span>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={7} style={{ background: '#f8faff', padding: '1rem 1.5rem' }}>
                                                    <div className="columns">
                                                        <div className="column">
                                                            <p className="is-size-7 has-text-grey has-text-weight-bold mb-2" style={{ textTransform: 'uppercase' }}>Journal Lines</p>
                                                            {entry.lines?.length > 0 ? (
                                                                <table className="table is-narrow is-fullwidth" style={{ background: 'transparent' }}>
                                                                    <thead>
                                                                        <tr>
                                                                            <th className="is-size-7">Account</th>
                                                                            <th className="has-text-right is-size-7">Debit</th>
                                                                            <th className="has-text-right is-size-7">Credit</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {entry.lines.map((line, i) => (
                                                                            <tr key={i}>
                                                                                <td className="is-size-7">{line.account_id}</td>
                                                                                <td className="has-text-right is-size-7">{line.debit > 0 ? `$${toDollarsData(line.debit)}` : '—'}</td>
                                                                                <td className="has-text-right is-size-7">{line.credit > 0 ? `$${toDollarsData(line.credit)}` : '—'}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            ) : <p className="has-text-grey is-size-7">No line items recorded.</p>}
                                                        </div>
                                                        <div className="column is-5">
                                                            <p className="is-size-7 has-text-grey has-text-weight-bold mb-2" style={{ textTransform: 'uppercase' }}>Details</p>
                                                            <p className="is-size-7"><strong>Entry ID:</strong> {entry.id}</p>
                                                            {meta.created_by && <p className="is-size-7"><strong>Recorded by:</strong> {meta.created_by}</p>}
                                                            {meta.type && <p className="is-size-7"><strong>Sub-type:</strong> {meta.type}</p>}
                                                            {meta.refNo && <p className="is-size-7"><strong>Reference:</strong> {meta.refNo}</p>}
                                                            {meta.notes && <p className="is-size-7"><strong>Notes:</strong> {meta.notes}</p>}
                                                        </div>
                                                    </div>

                                                    {/* Attach reference editor */}
                                                    {editingRefId === entry.id ? (
                                                        <ReferenceEditor
                                                            entry={entry}
                                                            onSaved={() => { setEditingRefId(null); fetchEntries(); }}
                                                        />
                                                    ) : (
                                                        <div className="buttons mt-2">
                                                            <button
                                                                className="button is-small is-info is-light"
                                                                onClick={(e) => { e.stopPropagation(); setEditingRefId(entry.id); }}
                                                            >
                                                                <span className="icon"><NotesBold size={13} /></span>
                                                                <span>{hasRef ? 'Edit Reference / Notes' : 'Attach Reference / Notes'}</span>
                                                            </button>
                                                            <button
                                                                className="button is-small is-danger is-light"
                                                                disabled={entry.status === 'void'}
                                                                onClick={(e) => { e.stopPropagation(); setVoidTarget(entry); }}
                                                            >
                                                                <span className="icon"><TrashBinTrashBold size={13} /></span>
                                                                <span>{entry.status === 'void' ? 'Voided' : 'Void Entry'}</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3}><strong>Showing {filtered.length} transactions</strong></td>
                                <td className="has-text-right">
                                    <div className="is-size-7 has-text-grey">Total Revenue: ${toDollarsData(totalSales)}</div>
                                    <div className="is-size-7 has-text-grey">Payments Received: ${toDollarsData(totalPayments)}</div>
                                </td>
                                <td className="has-text-right has-text-weight-bold has-text-success">
                                    <div className="is-size-6">${toDollarsData(totalCashIn)}</div>
                                    <div className="is-size-7 has-text-grey">Cash Received</div>
                                </td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
            {/* ── Void Confirmation Modal ── */}
            {voidTarget && (
                <div className="modal is-active">
                    <div className="modal-background" onClick={() => setVoidTarget(null)}></div>
                    <div className="modal-card" style={{ maxWidth: '480px' }}>
                        <header className="modal-card-head has-background-danger-light">
                            <p className="modal-card-title has-text-danger has-text-weight-bold">
                                <span className="icon mr-2"><TrashBinTrashBold size={20} /></span>
                                Void Journal Entry
                            </p>
                            <button className="delete" aria-label="close" onClick={() => setVoidTarget(null)}></button>
                        </header>
                        <section className="modal-card-body">
                            <p>Are you sure you want to void this entry?</p>
                            <p className="mt-3"><strong>Type:</strong> {TYPE_LABELS[voidTarget.type] || voidTarget.type}</p>
                            <p><strong>Amount:</strong> ${toDollarsData(voidTarget.total_cents)}</p>
                            <div className="notification is-warning is-light mt-4 mb-0">
                                This will <strong>reverse all account balance effects</strong>. The entry will remain visible for audit purposes.
                            </div>
                        </section>
                        <footer className="modal-card-foot">
                            <button
                                className={`button is-danger ${voiding ? 'is-loading' : ''}`}
                                disabled={voiding}
                                onClick={async () => {
                                    setVoiding(true);
                                    try {
                                        await voidJournalEntry(voidTarget.id, currentUser.uid);
                                        setVoidTarget(null);
                                        fetchEntries();
                                    } catch (err) {
                                        console.error(err);
                                        alert('Void failed: ' + err.message);
                                    }
                                    setVoiding(false);
                                }}
                            >
                                Yes, Void This Entry
                            </button>
                            <button className="button" onClick={() => setVoidTarget(null)}>Cancel</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}

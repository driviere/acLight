import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTenant } from '../../contexts/TenantContext';
import { formatCurrency } from '../../utils/moneyUtils';
import { CalendarBold, EyeBold, UsersGroupTwoRoundedBold } from 'solar-icon-set';
import Select from 'react-select';
import JournalDetailModal from './JournalDetailModal';
import { PageHeader } from '../../App';

const BILL_TYPES = ['cash_sale', 'credit_sale', 'sale'];

export default function CustomerStatements() {
    const { tenantId } = useTenant();
    const [customers, setCustomers] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const selectedId = selectedOption?.value ?? '';
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [viewingEntry, setViewingEntry] = useState(null);

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [startDate, setStartDate] = useState(startOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    useEffect(() => {
        if (!tenantId) return;
        getDocs(collection(db, 'tenants', tenantId, 'customers')).then(snap => {
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(c => ({ value: c.id, label: c.name }));
            setCustomers(list);
        });
    }, [tenantId]);

    useEffect(() => {
        if (!tenantId || !selectedId) return;
        const fetch = async () => {
            setLoading(true);
            try {
                const startTS = Timestamp.fromDate(new Date(startDate + 'T00:00:00'));
                const endTS = Timestamp.fromDate(new Date(endDate + 'T23:59:59'));
                const q = query(
                    collection(db, 'tenants', tenantId, 'journal_entries'),
                    where('metadata.customer_id', '==', selectedId),
                    where('date', '>=', startTS),
                    where('date', '<=', endTS),
                    orderBy('date', 'desc')
                );
                const snap = await getDocs(q);
                setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error(err);
                if (err.message?.includes('index')) {
                    alert('Index still building. Please try again in a few minutes.');
                }
            }
            setLoading(false);
        };
        fetch();
    }, [tenantId, selectedId, startDate, endDate]);

    const displayed = showAll ? entries : entries.filter(e => BILL_TYPES.includes(e.type));
    const totalBilled = entries.filter(e => BILL_TYPES.includes(e.type)).reduce((s, e) => s + (e.total_cents || 0), 0);
    const totalPaid = entries.filter(e => e.type === 'payment').reduce((s, e) => s + (e.total_cents || 0), 0);
    const outstanding = entries.reduce((s, e) => s + (e.outstanding_cents || 0), 0);

    const typeTag = (type) => {
        if (BILL_TYPES.includes(type)) return 'is-success is-light';
        if (type === 'payment') return 'is-info is-light';
        if (type === 'sales_return') return 'is-warning is-light';
        return 'is-light';
    };

    return (
        <div>
            <PageHeader
                title="Customer Statements"
                subtitle="View bills and transactions for an individual customer"
                icon={<UsersGroupTwoRoundedBold size={24} />}
            />

            {/* Controls */}
            <div className="box has-background-light p-4 mb-5">
                <div className="columns is-vcentered is-multiline">
                    <div className="column is-4">
                        <label className="label is-small mb-1">Customer</label>
                        <Select
                            options={customers}
                            value={selectedOption}
                            onChange={setSelectedOption}
                            placeholder="Select a customer…"
                            isClearable
                        />
                    </div>
                    <div className="column">
                        <label className="label is-small mb-1">
                            <span className="icon-text">
                                <span className="icon"><CalendarBold size={14} /></span>
                                <span>Date Range</span>
                            </span>
                        </label>
                        <div className="field is-grouped">
                            <div className="control">
                                <input className="input is-small" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="control py-1 is-size-7">to</div>
                            <div className="control">
                                <input className="input is-small" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="column is-narrow">
                        <label className="label is-small mb-1">&nbsp;</label>
                        <label className="checkbox is-size-7">
                            <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="mr-2" />
                            Show payments &amp; returns
                        </label>
                    </div>
                </div>
            </div>

            {!selectedId ? (
                <div className="notification is-light has-text-centered py-6">
                    <p className="has-text-grey">Select a customer above to view their statements.</p>
                </div>
            ) : (
                <>
                    {/* Summary Stats */}
                    <div className="columns is-mobile mb-5">
                        <div className="column">
                            <div className="box has-text-centered py-3">
                                <p className="heading">Total Billed</p>
                                <p className="title is-5 has-text-success">{formatCurrency(totalBilled)}</p>
                            </div>
                        </div>
                        <div className="column">
                            <div className="box has-text-centered py-3">
                                <p className="heading">Total Paid</p>
                                <p className="title is-5 has-text-info">{formatCurrency(totalPaid)}</p>
                            </div>
                        </div>
                        <div className="column">
                            <div className="box has-text-centered py-3">
                                <p className="heading">Outstanding</p>
                                <p className={`title is-5 ${outstanding > 0 ? 'has-text-danger' : 'has-text-grey'}`}>
                                    {formatCurrency(outstanding)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="has-text-centered py-6">
                            <button className="button is-loading is-white is-large"></button>
                        </div>
                    ) : displayed.length === 0 ? (
                        <div className="notification is-light has-text-centered py-6">
                            <p className="has-text-grey">No {showAll ? 'transactions' : 'bills'} found for this period.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table is-fullwidth is-hoverable is-narrowed">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Reference</th>
                                        <th>Items</th>
                                        <th className="has-text-right">Total</th>
                                        <th className="has-text-right">Outstanding</th>
                                        <th className="has-text-centered"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayed.map(entry => (
                                        <tr key={entry.id}>
                                            <td className="is-size-7 is-vcentered">
                                                {entry.date?.seconds
                                                    ? new Date(entry.date.seconds * 1000).toLocaleDateString()
                                                    : '—'}
                                            </td>
                                            <td className="is-vcentered">
                                                <span className={`tag is-small is-uppercase ${typeTag(entry.type)}`}>
                                                    {entry.type?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="is-size-7 is-vcentered">{entry.ref_no || '—'}</td>
                                            <td className="is-size-7 is-vcentered" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {entry.metadata?.items_summary || '—'}
                                            </td>
                                            <td className="has-text-right is-size-7 has-text-weight-bold is-vcentered">
                                                {formatCurrency(entry.total_cents)}
                                            </td>
                                            <td className="has-text-right is-size-7 is-vcentered">
                                                {entry.outstanding_cents > 0
                                                    ? <span className="has-text-danger">{formatCurrency(entry.outstanding_cents)}</span>
                                                    : <span className="has-text-grey-light">Paid</span>}
                                            </td>
                                            <td className="has-text-centered is-vcentered">
                                                <button
                                                    className="button is-ghost is-small p-0"
                                                    style={{ height: 'auto' }}
                                                    onClick={() => setViewingEntry(entry)}
                                                >
                                                    <span className="icon"><EyeBold size={16} /></span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            <JournalDetailModal
                isActive={!!viewingEntry}
                entry={viewingEntry}
                onClose={() => setViewingEntry(null)}
            />
        </div>
    );
}

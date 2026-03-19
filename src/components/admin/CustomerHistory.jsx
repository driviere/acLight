import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTenant } from '../../contexts/TenantContext';
import { toDollarsData, formatCurrency } from '../../utils/moneyUtils';
import { CalendarBold, HistoryBold, AltArrowLeftBold, EyeBold } from 'solar-icon-set';
import JournalDetailModal from '../modules/JournalDetailModal';

export default function CustomerHistory({ customer, onBack }) {
    const { tenantId } = useTenant();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingEntry, setViewingEntry] = useState(null);

    // Date Range Filters: Default to Jan 1st of current year to Today
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const [startDate, setStartDate] = useState(startOfYear.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const fetchHistory = async () => {
        if (!tenantId || !customer) return;
        setLoading(true);
        try {
            const startTS = Timestamp.fromDate(new Date(startDate + 'T00:00:00'));
            const endTS = Timestamp.fromDate(new Date(endDate + 'T23:59:59'));

            const q = query(
                collection(db, 'tenants', tenantId, 'journal_entries'),
                where('metadata.customer_id', '==', customer.id),
                where('date', '>=', startTS),
                where('date', '<=', endTS),
                orderBy('date', 'desc')
            );

            const snap = await getDocs(q);
            setEntries(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching customer history:", error);
            if (error.message.includes('index')) {
                alert("The system is still indexing this customer's history. Please try again in 2-3 minutes.");
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchHistory();
    }, [customer, tenantId, startDate, endDate]);

    const totalSales = entries.filter(e => ['sale', 'cash_sale', 'credit_sale'].includes(e.type)).reduce((s, e) => s + (e.total_cents || 0), 0);
    const totalPaid = entries.filter(e => e.type === 'payment').reduce((s, e) => s + (e.total_cents || 0), 0);

    return (
        <div className="customer-history">
            <div className="level is-mobile mb-5">
                <div className="level-left">
                    <button className="button is-light mr-3" onClick={onBack}>
                        <span className="icon"><AltArrowLeftBold /></span>
                        <span>Back</span>
                    </button>
                    <div>
                        <h3 className="title is-4 mb-0">{customer.name}</h3>
                        <p className="subtitle is-7 has-text-grey">Transaction History & Statements</p>
                    </div>
                </div>
                <div className="level-right">
                    <HistoryBold size={32} style={{ opacity: 0.1 }} />
                </div>
            </div>

            {/* Filters */}
            <div className="box has-background-light p-4 mb-5">
                <div className="columns is-mobile is-vcentered">
                    <div className="column is-narrow">
                        <span className="icon-text has-text-weight-bold">
                            <span className="icon"><CalendarBold /></span>
                            <span>Date Range:</span>
                        </span>
                    </div>
                    <div className="column">
                        <div className="field is-grouped">
                            <div className="control">
                                <input
                                    className="input is-small"
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="control py-1">to</div>
                            <div className="control">
                                <input
                                    className="input is-small"
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="columns is-mobile mb-5">
                <div className="column">
                    <div className="box has-text-centered py-3">
                        <p className="heading">Total Sales</p>
                        <p className="title is-5 has-text-success">{formatCurrency(totalSales)}</p>
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
                        <p className="title is-5 has-text-danger">
                            {formatCurrency(entries.reduce((s, e) => s + (e.outstanding_cents || 0), 0))}
                        </p>
                    </div>
                </div>
            </div>

            {/* Transaction List */}
            {loading ? (
                <div className="has-text-centered py-6">
                    <button className="button is-loading is-white is-large"></button>
                </div>
            ) : entries.length === 0 ? (
                <div className="notification is-light has-text-centered py-6">
                    <p className="has-text-grey">No transactions found for this period.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table is-fullwidth is-hoverable is-narrowed">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Reference</th>
                                <th className="has-text-right">Total</th>
                                <th className="has-text-right">Balance</th>
                                <th className="has-text-centered">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(entry => (
                                <tr key={entry.id}>
                                    <td className="is-size-7">{entry.date?.seconds ? new Date(entry.date.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                    <td>
                                        <span className={`tag is-small is-uppercase ${['sale', 'cash_sale', 'credit_sale'].includes(entry.type) ? 'is-success is-light' : 'is-info is-light'
                                            }`}>
                                            {entry.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="is-size-7">{entry.ref_no || '—'}</td>
                                    <td className="has-text-right is-size-7 has-text-weight-bold">{formatCurrency(entry.total_cents)}</td>
                                    <td className="has-text-right is-size-7 mr-2">
                                        {entry.outstanding_cents > 0 ? (
                                            <span className="has-text-danger">{formatCurrency(entry.outstanding_cents)}</span>
                                        ) : (
                                            <span className="has-text-grey-light">Paid</span>
                                        )}
                                    </td>
                                    <td className="has-text-centered">
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

            <JournalDetailModal
                isActive={!!viewingEntry}
                entry={viewingEntry}
                onClose={() => setViewingEntry(null)}
            />
        </div>
    );
}

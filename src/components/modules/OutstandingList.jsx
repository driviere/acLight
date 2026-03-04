import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { toDollarsData, toCents } from '../../utils/moneyUtils';
import { processInvoicePayment } from '../../services/journalService';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentTextBold, BillBold, HandMoneyBold, AddCircleBold } from 'solar-icon-set';
import { PageHeader } from '../../App';

// ── Payment Modal ─────────────────────────────────────────────
const PaymentModal = ({ invoice, type, isActive, onClose, onSuccess }) => {
    const { currentUser } = useAuth();
    const [amount, setAmount] = useState('');
    const [refNo, setRefNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isActive && invoice) {
            setAmount(toDollarsData(invoice.outstanding_cents));
            setRefNo('');
            setError('');
        }
    }, [isActive, invoice]);

    if (!isActive || !invoice) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const paymentCents = toCents(amount);
            if (paymentCents <= 0) throw new Error("Payment must be greater than zero.");
            if (paymentCents > invoice.outstanding_cents) throw new Error("Payment exceeds remaining balance.");
            await processInvoicePayment(invoice.id, paymentCents, type, { created_by: currentUser.uid, refNo });
            onSuccess();
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
        setLoading(false);
    };

    const entityName = type === 'receive'
        ? (invoice.metadata?.customer_name || 'Counter Sale')
        : (invoice.metadata?.vendor_name || 'Unknown Vendor');

    return (
        <div className="modal is-active">
            <div className="modal-background" onClick={onClose}></div>
            <div className="modal-card">
                <header className={`modal-card-head ${type === 'receive' ? 'has-background-success-light' : 'has-background-danger-light'}`}>
                    <p className={`modal-card-title has-text-weight-bold ${type === 'receive' ? 'has-text-success' : 'has-text-danger'}`}>
                        <span className="icon mr-2"><HandMoneyBold size={24} /></span>
                        {type === 'receive' ? 'Receive Payment from Customer' : 'Pay Vendor Bill'}
                    </p>
                    <button className="delete" aria-label="close" onClick={onClose}></button>
                </header>
                <section className="modal-card-body">
                    {error && <div className="notification is-danger is-light">{error}</div>}
                    <p className="subtitle is-6 mb-5">
                        Processing for <strong>{entityName}</strong>.<br />
                        Outstanding: <strong>${toDollarsData(invoice.outstanding_cents)}</strong>
                    </p>
                    <form id="payment-form" onSubmit={handleSubmit}>
                        <div className="field">
                            <label className="label">Payment Amount ($)</label>
                            <div className="control">
                                <input
                                    className="input is-large"
                                    type="number" step="0.01" min="0.01"
                                    max={toDollarsData(invoice.outstanding_cents)}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="field">
                            <label className="label">Reference / Cheque No. <span className="has-text-grey">(optional)</span></label>
                            <div className="control">
                                <input
                                    className="input is-medium"
                                    type="text" placeholder="e.g. CHQ-1002"
                                    value={refNo}
                                    onChange={(e) => setRefNo(e.target.value)}
                                />
                            </div>
                        </div>
                    </form>
                </section>
                <footer className="modal-card-foot">
                    <button
                        className={`button is-large is-fullwidth ${type === 'receive' ? 'is-success' : 'is-danger'} ${loading ? 'is-loading' : ''}`}
                        type="submit" form="payment-form"
                        disabled={loading || !amount}
                    >
                        <span className="icon"><AddCircleBold /></span>
                        <span>Submit Payment</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

// ── Invoice Row ───────────────────────────────────────────────
const InvoiceRow = ({ inv, type, onPay }) => {
    const dateStr = inv.date?.seconds ? new Date(inv.date.seconds * 1000).toLocaleDateString() : 'N/A';
    const name = type === 'ar'
        ? (inv.metadata?.customer_name || 'Counter Sale')
        : (inv.metadata?.vendor_name || 'Unknown Vendor');
    const isAr = type === 'ar';

    return (
        <tr>
            <td className="is-vcentered" style={{ whiteSpace: 'nowrap' }}>{dateStr}</td>
            <td className="is-vcentered"><strong>{name}</strong></td>
            {isAr && <td className="is-vcentered has-text-grey is-size-7">{inv.metadata?.items_summary || '—'}</td>}
            <td className={`has-text-right has-text-weight-bold is-vcentered ${isAr ? 'has-text-success' : 'has-text-danger'}`}>
                ${toDollarsData(inv.outstanding_cents)}
            </td>
            <td className="has-text-centered is-vcentered">
                <button
                    className={`button is-small ${isAr ? 'is-success' : 'is-danger'}`}
                    onClick={onPay}
                >
                    {isAr ? 'Receive' : 'Pay'}
                </button>
            </td>
        </tr>
    );
};

// ── Main Component ────────────────────────────────────────────
export default function OutstandingList() {
    const [apInvoices, setApInvoices] = useState([]);
    const [arInvoices, setArInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'bills'
    const [modalData, setModalData] = useState({ isActive: false, invoice: null, type: null });

    const fetchOutstanding = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'journal_entries'), where('status', 'in', ['unpaid', 'partial']));
            const snap = await getDocs(q);
            const apList = [], arList = [];
            snap.forEach(doc => {
                const data = doc.data();
                const invoice = { id: doc.id, ...data };
                if (data.type === 'sale' || data.type === 'credit_sale') arList.push(invoice);
                else if (data.type === 'purchase' || data.type === 'expense') apList.push(invoice);
            });
            setApInvoices(apList.sort((a, b) => b.date.seconds - a.date.seconds));
            setArInvoices(arList.sort((a, b) => b.date.seconds - a.date.seconds));
        } catch (error) {
            console.error("Error fetching outstanding lists:", error);
        }
        setLoading(false);
    };

    useEffect(() => { fetchOutstanding(); }, []);

    const openModal = (invoice, type) => setModalData({ isActive: true, invoice, type });
    const closeModal = () => setModalData({ isActive: false, invoice: null, type: null });

    if (loading && apInvoices.length === 0 && arInvoices.length === 0) {
        return <div className="has-text-centered" style={{ padding: '5rem' }}><span className="button is-loading is-white is-large"></span></div>;
    }

    return (
        <div>
            <PageHeader
                title="AR / AP Outstanding"
                subtitle="Apply payments and receipts against specific invoices and bills."
                icon={<DocumentTextBold size={24} />}
            />

            {/* ── Tabs ── */}
            <div className="tabs is-boxed is-medium mb-0">
                <ul>
                    <li className={activeTab === 'invoices' ? 'is-active' : ''}>
                        <a onClick={() => setActiveTab('invoices')} style={{ cursor: 'pointer' }}>
                            <span className="icon"><DocumentTextBold size={16} /></span>
                            <span>
                                Customer Invoices (AR)
                                {arInvoices.length > 0 && (
                                    <span className="tag is-success is-light ml-2">{arInvoices.length}</span>
                                )}
                            </span>
                        </a>
                    </li>
                    <li className={activeTab === 'bills' ? 'is-active' : ''}>
                        <a onClick={() => setActiveTab('bills')} style={{ cursor: 'pointer' }}>
                            <span className="icon"><BillBold size={16} /></span>
                            <span>
                                Vendor Bills (AP)
                                {apInvoices.length > 0 && (
                                    <span className="tag is-danger is-light ml-2">{apInvoices.length}</span>
                                )}
                            </span>
                        </a>
                    </li>
                </ul>
            </div>

            {/* ── Tab Content ── */}
            <div className="box" style={{ borderRadius: '0 12px 12px 12px', marginTop: 0 }}>

                {/* INVOICES / AR */}
                {activeTab === 'invoices' && (
                    arInvoices.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-emoji">📬</span>
                            <p className="empty-title">No outstanding invoices</p>
                            <p className="empty-subtitle">All customer balances are settled.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table is-fullwidth is-hoverable">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Items</th>
                                        <th className="has-text-right">Balance Owed</th>
                                        <th className="has-text-centered">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {arInvoices.map(inv => (
                                        <InvoiceRow
                                            key={inv.id}
                                            inv={inv}
                                            type="ar"
                                            onPay={() => openModal(inv, 'receive')}
                                        />
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3}><strong>Total Outstanding (AR)</strong></td>
                                        <td className="has-text-right has-text-success has-text-weight-bold">
                                            ${toDollarsData(arInvoices.reduce((s, i) => s + i.outstanding_cents, 0))}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )
                )}

                {/* BILLS / AP */}
                {activeTab === 'bills' && (
                    apInvoices.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-emoji">🎉</span>
                            <p className="empty-title">All clear!</p>
                            <p className="empty-subtitle">No outstanding vendor bills.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table is-fullwidth is-hoverable">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Vendor</th>
                                        <th className="has-text-right">Balance Due</th>
                                        <th className="has-text-centered">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apInvoices.map(inv => (
                                        <InvoiceRow
                                            key={inv.id}
                                            inv={inv}
                                            type="ap"
                                            onPay={() => openModal(inv, 'send')}
                                        />
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={2}><strong>Total Outstanding (AP)</strong></td>
                                        <td className="has-text-right has-text-danger has-text-weight-bold">
                                            ${toDollarsData(apInvoices.reduce((s, i) => s + i.outstanding_cents, 0))}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )
                )}
            </div>

            <PaymentModal
                isActive={modalData.isActive}
                invoice={modalData.invoice}
                type={modalData.type}
                onClose={closeModal}
                onSuccess={() => { closeModal(); fetchOutstanding(); }}
            />
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { toDollarsData, toCents } from '../../utils/moneyUtils';
import { processInvoicePayment } from '../../services/journalService';
import { useAuth } from '../../contexts/AuthContext';
import { DocumentTextBold, BillBold, HandMoneyBold, AddCircleBold } from 'solar-icon-set';

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

            await processInvoicePayment(
                invoice.id,
                paymentCents,
                type, // 'receive' for AR, 'send' for AP
                { created_by: currentUser.uid, refNo }
            );

            onSuccess();
        } catch (err) {
            console.error(err);
            setError(err.message);
        }

        setLoading(false);
    };

    const entityName = type === 'receive' ?
        (invoice.metadata?.customer_name || 'Counter Sale') :
        (invoice.metadata?.vendor_name || 'Unknown Vendor');

    return (
        <div className="modal is-active">
            <div className="modal-background" onClick={onClose}></div>
            <div className="modal-card">
                <header className="modal-card-head has-background-info-light">
                    <p className="modal-card-title has-text-info has-text-weight-bold">
                        <span className="icon mr-2"><HandMoneyBold size={24} /></span>
                        {type === 'receive' ? 'Receive Payment' : 'Pay Bill'}
                    </p>
                    <button className="delete" aria-label="close" onClick={onClose}></button>
                </header>
                <section className="modal-card-body">
                    {error && <div className="notification is-danger is-light">{error}</div>}

                    <p className="subtitle is-6 mb-5">
                        Processing payment for <strong>{entityName}</strong>.<br />
                        Outstanding Balance: <strong>${toDollarsData(invoice.outstanding_cents)}</strong>
                    </p>

                    <form id="payment-form" onSubmit={handleSubmit}>
                        <div className="field">
                            <label className="label">Payment Amount ($)</label>
                            <div className="control">
                                <input
                                    className="input is-large"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={toDollarsData(invoice.outstanding_cents)}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label className="label">Reference / Cheque No. (Optional)</label>
                            <div className="control">
                                <input
                                    className="input is-medium"
                                    type="text"
                                    placeholder="e.g. CHQ-1002"
                                    value={refNo}
                                    onChange={(e) => setRefNo(e.target.value)}
                                />
                            </div>
                        </div>
                    </form>
                </section>
                <footer className="modal-card-foot">
                    <button
                        className={`button is-info is-large is-fullwidth ${loading ? 'is-loading' : ''}`}
                        type="submit"
                        form="payment-form"
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

export default function OutstandingList() {
    const [apInvoices, setApInvoices] = useState([]);
    const [arInvoices, setArInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalData, setModalData] = useState({ isActive: false, invoice: null, type: null });

    const fetchOutstanding = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'journal_entries'), where('status', 'in', ['unpaid', 'partial']));
            const querySnapshot = await getDocs(q);

            let apList = [];
            let arList = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const invoice = { id: doc.id, ...data };

                if (data.type === 'sale') {
                    arList.push(invoice);
                } else if (data.type === 'purchase') {
                    apList.push(invoice);
                }
            });

            setApInvoices(apList.sort((a, b) => b.date.seconds - a.date.seconds));
            setArInvoices(arList.sort((a, b) => b.date.seconds - a.date.seconds));
        } catch (error) {
            console.error("Error fetching outstanding lists:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOutstanding();
    }, []);

    if (loading && apInvoices.length === 0 && arInvoices.length === 0) {
        return <div className="box has-text-centered"><span className="button is-loading is-white is-large"></span></div>;
    }

    return (
        <div className="container mt-5">
            <h1 className="title has-text-primary has-text-centered">Accounts Receivable & Payable</h1>
            <p className="subtitle has-text-grey has-text-centered mb-5">Manage outstanding balances and apply payments.</p>

            <div className="columns is-desktop mt-4">
                {/* AP Column */}
                <div className="column is-half">
                    <div className="box has-background-danger-light" style={{ borderRadius: '12px', height: '100%' }}>
                        <h3 className="title is-5 has-text-danger mb-4">
                            <span className="icon mr-2"><BillBold size={20} /></span>
                            Unpaid Vendor Bills (We Owe)
                        </h3>
                        {apInvoices.length === 0 ? (
                            <p className="has-text-grey">No outstanding bills.</p>
                        ) : (
                            <div className="table-container">
                                <table className="table is-fullwidth is-hoverable has-background-danger-light">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Vendor</th>
                                            <th className="has-text-right">Balance</th>
                                            <th className="has-text-centered">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {apInvoices.map(inv => {
                                            const dateStr = inv.date?.seconds ? new Date(inv.date.seconds * 1000).toLocaleDateString() : 'N/A';
                                            return (
                                                <tr key={inv.id}>
                                                    <td className="is-vcentered">{dateStr}</td>
                                                    <td className="is-vcentered">{inv.metadata?.vendor_name || 'Unknown'}</td>
                                                    <td className="has-text-right has-text-danger has-text-weight-bold is-vcentered">
                                                        ${toDollarsData(inv.outstanding_cents)}
                                                    </td>
                                                    <td className="has-text-centered is-vcentered">
                                                        <button
                                                            className="button is-danger is-small"
                                                            onClick={() => setModalData({ isActive: true, invoice: inv, type: 'send' })}
                                                        >
                                                            Pay
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* AR Column */}
                <div className="column is-half">
                    <div className="box has-background-link-light" style={{ borderRadius: '12px', height: '100%' }}>
                        <h3 className="title is-5 has-text-link mb-4">
                            <span className="icon mr-2"><DocumentTextBold size={20} /></span>
                            Unpaid Customer Invoices (Owed To Us)
                        </h3>
                        {arInvoices.length === 0 ? (
                            <p className="has-text-grey">No outstanding invoices.</p>
                        ) : (
                            <div className="table-container">
                                <table className="table is-fullwidth is-hoverable has-background-link-light">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Customer</th>
                                            <th className="has-text-right">Balance</th>
                                            <th className="has-text-centered">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {arInvoices.map(inv => {
                                            const dateStr = inv.date?.seconds ? new Date(inv.date.seconds * 1000).toLocaleDateString() : 'N/A';
                                            return (
                                                <tr key={inv.id}>
                                                    <td className="is-vcentered">{dateStr}</td>
                                                    <td className="is-vcentered">{inv.metadata?.customer_name || 'Counter Sale'}</td>
                                                    <td className="has-text-right has-text-link has-text-weight-bold is-vcentered">
                                                        ${toDollarsData(inv.outstanding_cents)}
                                                    </td>
                                                    <td className="has-text-centered is-vcentered">
                                                        <button
                                                            className="button is-success is-small"
                                                            onClick={() => setModalData({ isActive: true, invoice: inv, type: 'receive' })}
                                                        >
                                                            Receive
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PaymentModal
                isActive={modalData.isActive}
                invoice={modalData.invoice}
                type={modalData.type}
                onClose={() => setModalData({ isActive: false, invoice: null, type: null })}
                onSuccess={() => {
                    setModalData({ isActive: false, invoice: null, type: null });
                    fetchOutstanding(); // refresh tables
                }}
            />
        </div>
    );
}

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createJournalEntry } from '../../services/journalService';
import { toCents } from '../../utils/moneyUtils';
import { HandMoneyBold, AddCircleBold } from 'solar-icon-set';

export default function PaymentProcessor() {
    const { currentUser } = useAuth();
    const [entityName, setEntityName] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentType, setPaymentType] = useState('receive'); // receive = AR, send = AP
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const totalCents = toCents(amount);
            if (totalCents <= 0) {
                throw new Error("Payment amount must be greater than zero.");
            }

            const lines = [];

            if (paymentType === 'receive') {
                // Receiving payment against an outstanding AR invoice
                // Debit: Cash (increases asset)
                // Credit: Accounts Receivable (decreases asset)
                lines.push({ account_id: '1000_cash', debit: totalCents, credit: 0 });
                lines.push({ account_id: '1200_ar', debit: 0, credit: totalCents });
            } else if (paymentType === 'send') {
                // Sending payment against an outstanding AP bill
                // Debit: Accounts Payable (decreases liability)
                // Credit: Cash (decreases asset)
                lines.push({ account_id: '2000_ap', debit: totalCents, credit: 0 });
                lines.push({ account_id: '1000_cash', debit: 0, credit: totalCents });
            }

            await createJournalEntry(
                'payment',
                'paid', // Since this is a payment event, it's inherently paid
                `PAY-${Date.now()}`,
                totalCents,
                0, // Reduces outstanding separately via the query view, but the payment transaction itself has 0 outstanding
                lines,
                { created_by: currentUser.uid, entity_name: entityName, payment_type: paymentType }
            );

            setMessage({ type: 'success', text: paymentType === 'receive' ? 'Payment received successfully!' : 'Bill paid successfully!' });
            setEntityName('');
            setAmount('');
        } catch (error) {
            console.error(error);
            setMessage({ type: 'danger', text: error.message });
        }

        setLoading(false);
    };

    return (
        <div className="box mt-4">
            <h2 className="title is-4 has-text-info">
                <span className="icon mr-2"><HandMoneyBold size={24} /></span>
                Payment Processor
            </h2>
            <p className="subtitle is-6 mb-5">Process incoming cheques or pay vendor bills.</p>

            {message && (
                <div className={`notification is-${message.type} is-light`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="columns is-mobile">
                    <div className="column">
                        <div className="field">
                            <label className="label is-large">Direction</label>
                            <div className="control">
                                <div className="select is-large is-fullwidth">
                                    <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                                        <option value="receive">Receive AR Payment (In)</option>
                                        <option value="send">Pay AP Bill (Out)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="field">
                    <label className="label is-large">{paymentType === 'receive' ? 'Customer Name' : 'Vendor Name'}</label>
                    <div className="control">
                        <input
                            className="input is-large"
                            type="text"
                            placeholder="e.g. Acme Diner"
                            value={entityName}
                            onChange={(e) => setEntityName(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="field">
                    <label className="label is-large">Total Amount ($)</label>
                    <div className="control">
                        <input
                            className="input is-large"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="field mt-5">
                    <div className="control">
                        <button
                            className={`button is-info is-large is-fullwidth ${loading ? 'is-loading' : ''}`}
                            type="submit"
                            disabled={loading || !amount || !entityName}
                            style={{ height: '80px', fontSize: '1.5rem', borderRadius: '12px' }}
                        >
                            <span className="icon is-large mr-2"><AddCircleBold size={32} /></span>
                            <span>{paymentType === 'receive' ? 'Process Received Funds' : 'Process Vendor Payment'}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

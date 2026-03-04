import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createJournalEntry } from '../../services/journalService';
import { toCents } from '../../utils/moneyUtils';
import { BillBold, AddCircleBold } from 'solar-icon-set';

export default function ExpenseLogger() {
    const { currentUser } = useAuth();
    const [vendor, setVendor] = useState('');
    const [amount, setAmount] = useState('');
    const [expenseAccount, setExpenseAccount] = useState('5000_cogs');
    const [status, setStatus] = useState('unpaid');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const totalCents = toCents(amount);

            if (totalCents <= 0) {
                throw new Error("Amount must be greater than zero.");
            }

            // Constructing the Double-Entry lines:
            // Debit: Selected Expense Account
            // Credit: Accounts Payable (if unpaid) OR Cash (if paid)
            const lines = [
                { account_id: expenseAccount, debit: totalCents, credit: 0 },
            ];

            const creditAccount = status === 'paid' ? '1000_cash' : '2000_ap';
            lines.push({ account_id: creditAccount, debit: 0, credit: totalCents });

            const outstanding = status === 'unpaid' ? totalCents : 0;

            await createJournalEntry(
                'purchase',
                status,
                `VEND-${Date.now()}`,
                totalCents,
                outstanding,
                lines,
                { created_by: currentUser.uid, vendor_name: vendor }
            );

            setMessage({ type: 'success', text: 'Expense logged successfully!' });
            setVendor('');
            setAmount('');
            setStatus('unpaid');
        } catch (error) {
            console.error(error);
            setMessage({ type: 'danger', text: error.message });
        }

        setLoading(false);
    };

    return (
        <div className="box mt-4">
            <h2 className="title is-4 has-text-danger">
                <span className="icon mr-2"><BillBold size={24} /></span>
                Log Vendor Bill / Expense
            </h2>
            <p className="subtitle is-6 mb-5">Record incoming invoices and receipts.</p>

            {message && (
                <div className={`notification is-${message.type} is-light`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="field">
                    <label className="label is-large">Vendor Name</label>
                    <div className="control">
                        <input
                            className="input is-large"
                            type="text"
                            placeholder="e.g. Acme Flour Co."
                            value={vendor}
                            onChange={(e) => setVendor(e.target.value)}
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

                <div className="columns is-mobile">
                    <div className="column">
                        <div className="field">
                            <label className="label is-medium">Category</label>
                            <div className="control">
                                <div className="select is-large is-fullwidth">
                                    <select value={expenseAccount} onChange={(e) => setExpenseAccount(e.target.value)}>
                                        <option value="5000_cogs">Ingredients (COGS)</option>
                                        <option value="6000_rent">Rent / Lease</option>
                                        <option value="6100_utilities">Utilities</option>
                                        <option value="6200_payroll">Payroll</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="column">
                        <div className="field">
                            <label className="label is-medium">Status</label>
                            <div className="control">
                                <div className="select is-large is-fullwidth">
                                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                        <option value="unpaid">Unpaid (Bill / AP)</option>
                                        <option value="paid">Paid (Cash / Receipt)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="field mt-5">
                    <div className="control">
                        <button
                            className={`button is-danger is-large is-fullwidth ${loading ? 'is-loading' : ''}`}
                            type="submit"
                            disabled={loading || !amount}
                            style={{ height: '80px', fontSize: '1.5rem', borderRadius: '12px' }}
                        >
                            <span className="icon is-large mr-2"><AddCircleBold size={32} /></span>
                            <span>Log Business Expense</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

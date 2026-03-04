import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createJournalEntry } from '../../services/journalService';
import { toCents } from '../../utils/moneyUtils';
import { DocumentBold, AddCircleBold } from 'solar-icon-set';

export default function SalesTracker() {
    const { currentUser } = useAuth();
    const [breadSales, setBreadSales] = useState('');
    const [pastrySales, setPastrySales] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const breadCents = toCents(breadSales);
            const pastryCents = toCents(pastrySales);
            const totalCents = breadCents + pastryCents;

            if (totalCents <= 0) {
                throw new Error("Cannot log an empty or negative sale.");
            }

            // Constructing the Double-Entry lines:
            // Debit: Main Cash Drawer (increase asset)
            // Credit: Bread Sales (increase revenue)
            // Credit: Pastry Sales (increase revenue)
            const lines = [
                { account_id: '1000_cash', debit: totalCents, credit: 0 },
            ];

            if (breadCents > 0) {
                lines.push({ account_id: '4000_sales_bread', debit: 0, credit: breadCents });
            }
            if (pastryCents > 0) {
                lines.push({ account_id: '4010_sales_pastry', debit: 0, credit: pastryCents });
            }

            await createJournalEntry(
                'sale',
                'paid', // Assuming cash counter sales are paid immediately
                `SALE-${Date.now()}`,
                totalCents,
                0, // 0 outstanding since it's fully paid
                lines,
                { created_by: currentUser.uid, type: 'daily_counter_sales' }
            );

            setMessage({ type: 'success', text: 'Daily sales logged successfully!' });
            setBreadSales('');
            setPastrySales('');
        } catch (error) {
            console.error(error);
            setMessage({ type: 'danger', text: error.message });
        }

        setLoading(false);
    };

    return (
        <div className="box mt-4">
            <h2 className="title is-4 has-text-primary">
                <span className="icon mr-2"><DocumentBold size={24} /></span>
                Quick Sales Tracker
            </h2>
            <p className="subtitle is-6 mb-5">Log end-of-day register totals.</p>

            {message && (
                <div className={`notification is-${message.type} is-light`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="field">
                    <label className="label is-large">Bread Sales ($)</label>
                    <div className="control">
                        <input
                            className="input is-large"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={breadSales}
                            onChange={(e) => setBreadSales(e.target.value)}
                        />
                    </div>
                </div>

                <div className="field">
                    <label className="label is-large">Pastry Sales ($)</label>
                    <div className="control">
                        <input
                            className="input is-large"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={pastrySales}
                            onChange={(e) => setPastrySales(e.target.value)}
                        />
                    </div>
                </div>

                <div className="field mt-6">
                    <div className="control">
                        <button
                            className={`button is-success is-large is-fullwidth ${loading ? 'is-loading' : ''}`}
                            type="submit"
                            disabled={loading || (!breadSales && !pastrySales)}
                            style={{ height: '80px', fontSize: '1.5rem', borderRadius: '12px' }}
                        >
                            <span className="icon is-large mr-2"><AddCircleBold size={32} /></span>
                            <span>Log Cash Register Sales</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

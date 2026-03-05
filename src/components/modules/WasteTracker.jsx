import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createJournalEntry } from '../../services/journalService';
import { toCents } from '../../utils/moneyUtils';
import { TrashBinTrashBold, AddCircleBold } from 'solar-icon-set';

export default function WasteTracker() {
    const { currentUser } = useAuth();
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [wasteAmount, setWasteAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const wasteCents = toCents(wasteAmount);
            if (wasteCents <= 0) {
                throw new Error("Waste value must be greater than zero.");
            }

            // Waste tracking hits Equity or Inventory constraints.
            // Debit: Waste Expense
            // Credit: Inventory Asset
            const lines = [
                { account_id: '5100_waste', debit: wasteCents, credit: 0 },
                { account_id: '1400_inventory', debit: 0, credit: wasteCents }
            ];

            await createJournalEntry(
                'waste',
                'paid', // Assuming internal loss resolves immediately
                `WST-${Date.now()}`,
                wasteCents,
                0,
                lines,
                {
                    created_by: currentUser.uid,
                    type: 'end_of_day_waste',
                    item_description: description,
                    quantity: quantity ? parseFloat(quantity) : null,
                    unit_price_cents: price ? toCents(price) : null,
                }
            );

            setMessage({ type: 'success', text: 'Waste logged successfully!' });
            setDescription('');
            setQuantity('');
            setPrice('');
            setWasteAmount('');
        } catch (error) {
            console.error(error);
            setMessage({ type: 'danger', text: error.message });
        }

        setLoading(false);
    };

    return (
        <div className="box mt-4">
            <h2 className="title is-4 has-text-grey">
                <span className="icon mr-2"><TrashBinTrashBold size={24} /></span>
                Spoilage &amp; Waste Log
            </h2>
            <p className="subtitle is-6 mb-5">Record burned or unsold daily products.</p>

            {message && (
                <div className={`notification is-${message.type} is-light`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Item Description — Required */}
                <div className="field">
                    <label className="label">Item Description <span className="has-text-danger">*</span></label>
                    <div className="control">
                        <input
                            className="input"
                            type="text"
                            placeholder="e.g. Plantain Bread, Cinnamon Rolls"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Quantity & Unit Price — Optional */}
                <div className="columns">
                    <div className="column">
                        <div className="field">
                            <label className="label">
                                Quantity <span className="has-text-grey is-size-7">(optional)</span>
                            </label>
                            <div className="control">
                                <input
                                    className="input"
                                    type="number"
                                    step="1"
                                    min="1"
                                    placeholder="e.g. 10"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="column">
                        <div className="field">
                            <label className="label">
                                Unit Price ($) <span className="has-text-grey is-size-7">(optional)</span>
                            </label>
                            <div className="control">
                                <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Estimated Value — Required */}
                <div className="field">
                    <label className="label is-large">Total Estimated Value ($)</label>
                    <div className="control">
                        <input
                            className="input is-large"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={wasteAmount}
                            onChange={(e) => setWasteAmount(e.target.value)}
                        />
                    </div>
                </div>

                <div className="field mt-5">
                    <div className="control">
                        <button
                            className={`button is-dark is-large is-fullwidth ${loading ? 'is-loading' : ''}`}
                            type="submit"
                            disabled={loading || !wasteAmount || !description}
                            style={{ height: '80px', fontSize: '1.5rem', borderRadius: '12px' }}
                        >
                            <span className="icon is-large mr-2"><AddCircleBold size={32} /></span>
                            <span>Log Bakery Waste</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

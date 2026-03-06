import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { createJournalEntry } from '../../services/journalService';
import { toCents } from '../../utils/moneyUtils';
import { TrashBinTrashBold, AddCircleBold, NotesBold, BagBold, BanknoteBold, Smartphone2Bold } from 'solar-icon-set';
import PageLayout from '../layout/PageLayout';

export default function WasteTracker() {
    const { currentUser } = useAuth();
    const { tenantId } = useTenant();
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
            // Debit: Operating Expenses (waste is an operating cost)
            // Credit: Inventory Asset
            const lines = [
                { account_id: '5100_operating', debit: wasteCents, credit: 0 },
                { account_id: '1400_inventory', debit: 0, credit: wasteCents }
            ];

            await createJournalEntry(
                tenantId,
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
        <PageLayout
            title="Spoilage & Waste"
            subtitle="Log burned or unsold daily products."
            icon={<TrashBinTrashBold size={24} />}
        >
            <div className="bl-card-premium p-5 bl-glass">

                {message && (
                    <div className={`notification is-${message.type} is-light`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Item Description — Required */}
                    <div className="field">
                        <label className="bl-label-icon is-size-5">
                            <span className="icon"><NotesBold size={20} /></span>
                            <span>Item Description <span className="has-text-danger">*</span></span>
                        </label>
                        <div className="control">
                            <input
                                className="input is-large"
                                type="text"
                                placeholder="e.g. Plantain Bread, Cinnamon Rolls"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                style={{ borderRadius: '12px' }}
                            />
                        </div>
                    </div>

                    {/* Quantity & Unit Price — Optional */}
                    <div className="columns is-variable is-4 mt-4">
                        <div className="column">
                            <div className="field">
                                <label className="bl-label-icon is-size-6">
                                    <span className="icon"><BagBold size={18} /></span>
                                    <span>Quantity <small className="has-text-grey ml-1">(optional)</small></span>
                                </label>
                                <div className="control">
                                    <input
                                        className="input is-large"
                                        type="number"
                                        step="1"
                                        min="1"
                                        placeholder="e.g. 10"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        style={{ borderRadius: '12px' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="column">
                            <div className="field">
                                <label className="bl-label-icon is-size-6">
                                    <span className="icon"><BanknoteBold size={18} /></span>
                                    <span>Unit Price ($) <small className="has-text-grey ml-1">(optional)</small></span>
                                </label>
                                <div className="control">
                                    <input
                                        className="input is-large"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="0.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        style={{ borderRadius: '12px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Estimated Value — Required */}
                    <div className="field mt-5">
                        <label className="bl-label-icon is-size-5">
                            <span className="icon"><Smartphone2Bold size={24} /></span>
                            <span>Total Estimated Value ($)</span>
                        </label>
                        <div className="control">
                            <input
                                className="input is-large"
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={wasteAmount}
                                onChange={(e) => setWasteAmount(e.target.value)}
                                style={{ borderRadius: '12px', fontWeight: 800, color: '#e53e3e' }}
                            />
                        </div>
                    </div>

                    <div className="field mt-6">
                        <div className="control">
                            <button
                                className={`button is-large is-fullwidth ${loading ? 'is-loading' : ''}`}
                                type="submit"
                                disabled={loading || !wasteAmount || !description}
                                style={{
                                    height: '80px',
                                    fontSize: '1.5rem',
                                    borderRadius: '20px',
                                    background: 'var(--bl-grad-dark)',
                                    color: 'white',
                                    border: 'none',
                                    boxShadow: 'var(--bl-shadow-lg)'
                                }}
                            >
                                <span className="icon is-large mr-3"><TrashBinTrashBold size={32} /></span>
                                <span>Log Bakery Waste</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </PageLayout>
    );
}

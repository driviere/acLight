import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { createJournalEntry } from '../../services/journalService';
import { getAllAccounts } from '../../services/accountService';
import { toCents } from '../../utils/moneyUtils';
import { useToast } from '../../App';
import CreatableSelect from 'react-select/creatable';
import { BillBold, AddCircleBold } from 'solar-icon-set';

export default function ExpenseLogger() {
    const { currentUser } = useAuth();
    const [vendors, setVendors] = useState([]);
    const [expenseAccounts, setExpenseAccounts] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [creatingVendor, setCreatingVendor] = useState(false);
    const [amount, setAmount] = useState('');
    const [expenseAccount, setExpenseAccount] = useState('5000_cogs');
    const [itemsDescription, setItemsDescription] = useState('');
    const [status, setStatus] = useState('unpaid');
    const [loading, setLoading] = useState(false);
    const { showToast, ToastComponent } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            const [vendorSnap, allAccounts] = await Promise.all([
                getDocs(collection(db, 'vendors')),
                getAllAccounts()
            ]);
            const list = vendorSnap.docs.map(doc => ({ value: doc.id, label: doc.data().name }));
            setVendors(list.sort((a, b) => a.label.localeCompare(b.label)));
            setExpenseAccounts(allAccounts.filter(a => a.type === 'expense' && a.active !== false));
        };
        fetchData();
    }, []);

    const handleCreateVendor = async (inputName) => {
        const name = inputName.trim();
        if (!name) return;
        setCreatingVendor(true);
        try {
            const docRef = await addDoc(collection(db, 'vendors'), {
                name,
                createdAt: Timestamp.now(),
                createdBy: currentUser.uid,
            });
            const newOption = { value: docRef.id, label: name };
            setVendors(prev => [...prev, newOption].sort((a, b) => a.label.localeCompare(b.label)));
            setSelectedVendor(newOption);
            showToast(`✅ Vendor "${name}" created and selected!`, 'success');
        } catch (err) {
            console.error('Failed to create vendor:', err);
            showToast(`Failed to create vendor: ${err.message}`, 'danger');
        }
        setCreatingVendor(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedVendor) {
            showToast('Please select or create a vendor.', 'danger');
            return;
        }

        setLoading(true);

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

            // Issue #4 fix: COGS-type accounts → 'purchase'; operating expenses → 'expense'
            const journalType = expenseAccount.startsWith('5000') ? 'purchase' : 'expense';

            await createJournalEntry(
                journalType,
                status,
                `VEND-${Date.now()}`,
                totalCents,
                outstanding,
                lines,
                {
                    created_by: currentUser.uid,
                    vendor_name: selectedVendor.label,
                    items_summary: itemsDescription.trim() || undefined
                }
            );

            showToast('Expense logged successfully!', 'success');
            setSelectedVendor(null);
            setAmount('');
            setItemsDescription('');
            setStatus('unpaid');
        } catch (error) {
            console.error(error);
            showToast(error.message, 'danger');
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

            {ToastComponent}

            <form onSubmit={handleSubmit}>
                <div className="field">
                    <label className="label is-large">Vendor Name</label>
                    <div className="control">
                        <CreatableSelect
                            options={vendors}
                            value={selectedVendor}
                            onChange={setSelectedVendor}
                            onCreateOption={handleCreateVendor}
                            isLoading={creatingVendor}
                            isDisabled={creatingVendor}
                            placeholder="Search or type a new vendor name..."
                            isClearable
                            formatCreateLabel={(inputValue) => (
                                <span><strong>➕ Add new vendor:</strong> "{inputValue}"</span>
                            )}
                            noOptionsMessage={() => 'Type a vendor name to search or create'}
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    height: '50px', // matches is-large input
                                    fontSize: '1.25rem'
                                })
                            }}
                        />
                    </div>
                </div>

                <div className="field">
                    <label className="label is-large">Items Description</label>
                    <div className="control">
                        <input
                            className="input is-large"
                            type="text"
                            placeholder="e.g. 5 bags of flour, 2 boxes of sugar"
                            value={itemsDescription}
                            onChange={(e) => setItemsDescription(e.target.value)}
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
                                        {expenseAccounts.length === 0 ? (
                                            <>
                                                <option value="5000_cogs">Cost of Goods Sold</option>
                                                <option value="5100_operating">Operating Expenses</option>
                                                <option value="6000_rent">Rent &amp; Lease</option>
                                                <option value="6100_utilities">Utilities</option>
                                                <option value="6200_payroll">Payroll</option>
                                            </>
                                        ) : expenseAccounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
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

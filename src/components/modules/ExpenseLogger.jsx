import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { createJournalEntry } from '../../services/journalService';
import { getNextInvoiceNumber } from '../../services/numberingService';
import { getAllAccounts } from '../../services/accountService';
import { toCents } from '../../utils/moneyUtils';
import { useToast } from '../../App';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import {
    BillBold,
    AddCircleBold,
    UsersGroupTwoRoundedBold,
    NotesBold,
    HashtagSquareBold,
    CalendarBold,
    BanknoteBold,
    SettingsBold,
    ShieldCheckBold
} from 'solar-icon-set';
import PageLayout from '../layout/PageLayout';

export default function ExpenseLogger() {
    const { currentUser } = useAuth();
    const { tenantId } = useTenant();
    const [vendors, setVendors] = useState([]);
    const [expenseAccounts, setExpenseAccounts] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [creatingVendor, setCreatingVendor] = useState(false);
    const [amount, setAmount] = useState('');
    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [expenseAccount, setExpenseAccount] = useState('5000_cogs');
    const [itemsDescription, setItemsDescription] = useState('');
    const [status, setStatus] = useState('unpaid');
    const [loading, setLoading] = useState(false);
    const { showToast, ToastComponent } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            if (!tenantId) return;
            const [vendorSnap, allAccounts] = await Promise.all([
                getDocs(collection(db, 'tenants', tenantId, 'vendors')),
                getAllAccounts(tenantId)
            ]);
            const list = vendorSnap.docs.map(doc => ({ value: doc.id, label: doc.data().name }));
            setVendors(list.sort((a, b) => a.label.localeCompare(b.label)));
            setExpenseAccounts(allAccounts.filter(a => a.type === 'expense' && a.active !== false));
        };
        fetchData();
    }, [tenantId]);

    const handleCreateVendor = async (inputName) => {
        const name = inputName.trim();
        if (!name || !tenantId) return;
        setCreatingVendor(true);
        try {
            const docRef = await addDoc(collection(db, 'tenants', tenantId, 'vendors'), {
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

            // Resolve reference number
            let finalRefNo = invoiceNo.trim();
            if (!finalRefNo) {
                finalRefNo = await getNextInvoiceNumber(tenantId);
            }

            // Create timestamp safely avoiding timezone shift (set to noon)
            const [y, m, d] = invoiceDate.split('-');
            const entryDateObj = new Date(y, m - 1, d, 12, 0, 0);

            await createJournalEntry(
                tenantId,
                journalType,
                status,
                finalRefNo,
                totalCents,
                outstanding,
                lines,
                {
                    created_by: currentUser.uid,
                    vendor_name: selectedVendor.label,
                    items_summary: itemsDescription.trim() || undefined,
                    invoice_date: Timestamp.fromDate(entryDateObj),
                    customDate: Timestamp.fromDate(entryDateObj)
                }
            );

            showToast(`Expense logged successfully as ${finalRefNo}!`, 'success');
            setSelectedVendor(null);
            setAmount('');
            setInvoiceNo('');
            setItemsDescription('');
            setStatus('unpaid');
        } catch (error) {
            console.error(error);
            showToast(error.message, 'danger');
        }

        setLoading(false);
    };

    return (
        <PageLayout
            title="Expenses"
            subtitle="Record incoming vendor bills and receipts."
            icon={<BillBold size={24} />}
        >
            <div className="bl-card-premium p-5 bl-glass">

                {ToastComponent}

                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label className="bl-label-icon is-size-5">
                            <span className="icon"><UsersGroupTwoRoundedBold size={20} /></span>
                            <span>Vendor</span>
                        </label>
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
                                components={{ IndicatorSeparator: () => null }}
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        height: 'var(--bl-input-height, 50px)',
                                        fontSize: 'var(--bl-input-font-size, 1.25rem)',
                                        minHeight: 'var(--bl-input-height, 50px)',
                                        borderRadius: '12px',
                                        border: '1px solid #d1d9e0',
                                        boxShadow: 'none',
                                        '&:hover': {
                                            borderColor: 'var(--bl-primary)'
                                        }
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        fontSize: 'var(--bl-input-font-size, 1.25rem)',
                                        color: '#a0aec0'
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        fontSize: 'var(--bl-input-font-size, 1.25rem)',
                                        color: 'var(--bl-text-main)'
                                    })
                                }}
                            />
                        </div>
                    </div>

                    <div className="field mt-5">
                        <label className="bl-label-icon is-size-5">
                            <span className="icon"><NotesBold size={20} /></span>
                            <span>Items Description</span>
                        </label>
                        <div className="control">
                            <input
                                className="input is-large"
                                type="text"
                                placeholder="e.g. 5 bags of flour, 2 boxes of sugar"
                                value={itemsDescription}
                                onChange={(e) => setItemsDescription(e.target.value)}
                                style={{ borderRadius: '12px' }}
                            />
                        </div>
                    </div>

                    <div className="columns is-variable is-4 mt-4">
                        <div className="column">
                            <div className="field">
                                <label className="bl-label-icon is-size-6">
                                    <span className="icon"><HashtagSquareBold size={18} /></span>
                                    <span>Invoice No. <small className="has-text-grey ml-1">(optional)</small></span>
                                </label>
                                <div className="control">
                                    <input
                                        className="input is-large"
                                        type="text"
                                        placeholder="Auto-generated"
                                        value={invoiceNo}
                                        onChange={(e) => setInvoiceNo(e.target.value)}
                                        style={{ borderRadius: '12px' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="column">
                            <div className="field">
                                <label className="bl-label-icon is-size-6">
                                    <span className="icon"><CalendarBold size={18} /></span>
                                    <span>Invoice Date</span>
                                </label>
                                <div className="control">
                                    <input
                                        className="input is-large"
                                        type="date"
                                        value={invoiceDate}
                                        onChange={(e) => setInvoiceDate(e.target.value)}
                                        required
                                        style={{ borderRadius: '12px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="field mt-4">
                        <label className="bl-label-icon is-size-5">
                            <span className="icon"><BanknoteBold size={20} /></span>
                            <span>Total Amount ($)</span>
                        </label>
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
                                style={{ borderRadius: '12px', fontWeight: 800, color: 'var(--bl-primary)' }}
                            />
                        </div>
                    </div>

                    <div className="bl-form-section">
                        <div className="field">
                            <label className="bl-label-icon is-size-5">
                                <span className="icon"><SettingsBold size={20} /></span>
                                <span>Category</span>
                            </label>
                            <div className="control">
                                <Select
                                    value={
                                        expenseAccounts.length === 0
                                            ? { value: expenseAccount, label: expenseAccount } // Fallback before load
                                            : { value: expenseAccount, label: expenseAccounts.find(a => a.id === expenseAccount)?.name || 'Select Category' }
                                    }
                                    onChange={(opt) => setExpenseAccount(opt.value)}
                                    options={
                                        expenseAccounts.length === 0
                                            ? [
                                                { value: '5000_cogs', label: 'Cost of Goods Sold' },
                                                { value: '5100_operating', label: 'Operating Expenses' },
                                                { value: '6000_rent', label: 'Rent & Lease' },
                                                { value: '6100_utilities', label: 'Utilities' },
                                                { value: '6200_payroll', label: 'Payroll' }
                                            ]
                                            : expenseAccounts.map(a => ({ value: a.id, label: a.name }))
                                    }
                                    isSearchable={false}
                                    components={{ IndicatorSeparator: () => null }}
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            height: 'var(--bl-input-height, 50px)',
                                            fontSize: 'var(--bl-input-font-size, 1.25rem)',
                                            minHeight: 'var(--bl-input-height, 50px)',
                                            borderRadius: '12px',
                                            border: '1px solid #d1d9e0',
                                            boxShadow: 'none',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                borderColor: 'var(--bl-primary)'
                                            }
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            fontSize: 'var(--bl-input-font-size, 1.25rem)',
                                            color: 'var(--bl-text-main)'
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            fontSize: 'var(--bl-input-font-size, 1.25rem)',
                                            backgroundColor: state.isSelected ? 'var(--bl-primary)' : state.isFocused ? 'var(--bl-light)' : 'transparent',
                                            color: state.isSelected ? 'white' : 'var(--bl-text-main)',
                                            cursor: 'pointer'
                                        })
                                    }}
                                />
                            </div>
                        </div>

                        <div className="field mt-5">
                            <label className="bl-label-icon is-size-5">
                                <span className="icon"><ShieldCheckBold size={20} /></span>
                                <span>Status</span>
                            </label>
                            <div className="control">
                                <Select
                                    value={{
                                        value: status,
                                        label: status === 'unpaid' ? 'Unpaid (Bill / AP)' : 'Paid (Cash / Receipt)'
                                    }}
                                    onChange={(opt) => setStatus(opt.value)}
                                    options={[
                                        { value: 'unpaid', label: 'Unpaid (Bill / AP)' },
                                        { value: 'paid', label: 'Paid (Cash / Receipt)' }
                                    ]}
                                    isSearchable={false}
                                    components={{ IndicatorSeparator: () => null }}
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            height: 'var(--bl-input-height, 50px)',
                                            fontSize: 'var(--bl-input-font-size, 1.25rem)',
                                            minHeight: 'var(--bl-input-height, 50px)',
                                            borderRadius: '12px',
                                            border: '1px solid #d1d9e0',
                                            boxShadow: 'none',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                borderColor: 'var(--bl-primary)'
                                            }
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            fontSize: 'var(--bl-input-font-size, 1.25rem)',
                                            color: 'var(--bl-text-main)'
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            fontSize: 'var(--bl-input-font-size, 1.25rem)',
                                            backgroundColor: state.isSelected ? 'var(--bl-primary)' : state.isFocused ? 'var(--bl-light)' : 'transparent',
                                            color: state.isSelected ? 'white' : 'var(--bl-text-main)',
                                            cursor: 'pointer'
                                        })
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="field mt-6">
                        <div className="control">
                            <button
                                className={`button is-large is-fullwidth ${loading ? 'is-loading' : ''}`}
                                type="submit"
                                disabled={loading || !amount}
                                style={{
                                    height: '80px',
                                    fontSize: '1.5rem',
                                    borderRadius: '20px',
                                    background: 'var(--bl-grad-primary)',
                                    color: 'white',
                                    border: 'none',
                                    boxShadow: 'var(--bl-shadow-lg)'
                                }}
                            >
                                <span className="icon is-large mr-3"><AddCircleBold size={32} /></span>
                                <span>Log Business Expense</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </PageLayout>
    );
}

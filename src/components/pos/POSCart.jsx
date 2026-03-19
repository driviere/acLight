import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { toDollarsData, isBalanced } from '../../utils/moneyUtils';
import { useToast } from '../../App';
import { getNextInvoiceNumber, getNextReceiptNumber } from '../../services/numberingService';
import { ensureBaseAccounts } from '../../services/accountService';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { CartLargeMinimalisticBold, AddCircleBold, MinusCircleBold, BoxBold, NotesBold, ArrowLeftBold, HandMoneyBold } from 'solar-icon-set';
import ReceiptModal from './ReceiptModal';

export default function POSCart({ saleType, goBack }) {
    const { currentUser } = useAuth();
    const { tenantId } = useTenant();
    const [items, setItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [creatingCustomer, setCreatingCustomer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [receiptData, setReceiptData] = useState(null);
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [discountValue, setDiscountValue] = useState('');
    const [manualRefNo, setManualRefNo] = useState('');
    const [customerInvoices, setCustomerInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const { showToast, ToastComponent } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            if (!tenantId) return;
            setLoading(true);
            try {
                await ensureBaseAccounts(tenantId);
                const [itemsSnap, custSnap] = await Promise.all([
                    getDocs(collection(db, 'tenants', tenantId, 'items')),
                    getDocs(collection(db, 'tenants', tenantId, 'customers'))
                ]);
                setItems(itemsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                const cList = custSnap.docs.map(d => ({ value: d.id, label: d.data().name }));
                setCustomers(cList.sort((a, b) => a.label.localeCompare(b.label)));
            } catch (err) {
                console.error("Error fetching POS data", err);
                setError("Failed to load inventory. Check your connection.");
            }
            setLoading(false);
        };
        fetchData();
    }, [saleType, tenantId]);

    // ── Fetch Invoices for Selected Customer (Returns only) ────
    useEffect(() => {
        const fetchInvoices = async () => {
            if (saleType === 'return' && selectedCustomer && tenantId) {
                try {
                    const { collection, query, where, getDocs } = await import('firebase/firestore');
                    const q = query(
                        collection(db, 'tenants', tenantId, 'journal_entries'),
                        where('metadata.customer_id', '==', selectedCustomer.value),
                        where('status', 'in', ['unpaid', 'partial'])
                    );
                    const snap = await getDocs(q);
                    setCustomerInvoices(snap.docs.map(d => ({
                        id: d.id,
                        label: `${d.data().ref_no || d.id} — Bal: $${toDollarsData(d.data().outstanding_cents)}`,
                        value: d.id,
                        ...d.data()
                    })));
                } catch (err) {
                    console.error("Error fetching customer invoices:", err);
                }
            } else {
                setCustomerInvoices([]);
                setSelectedInvoice(null);
            }
        };
        fetchInvoices();
    }, [selectedCustomer, saleType, tenantId]);

    const availableItems = (saleType === 'return' && selectedInvoice)
        ? items.filter(i => selectedInvoice.metadata?.items?.some(invItem => invItem.id === i.id))
        : items;

    const quickItems = availableItems.filter(i => i.is_quick_access).sort((a, b) => a.name.localeCompare(b.name));
    const allItemsOptions = availableItems.map(i => ({ value: i.id, label: `${i.name} — $${toDollarsData(i.price_cents)}`, item: i }));
    const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    // Clear cart if invoice changes
    useEffect(() => {
        setCart([]);
    }, [selectedInvoice]);

    // ── Inline Customer Creation ──────────────────────────────
    const handleCreateCustomer = async (inputName) => {
        const name = inputName.trim();
        if (!name || !tenantId) return;
        setCreatingCustomer(true);
        try {
            const docRef = await addDoc(collection(db, 'tenants', tenantId, 'customers'), {
                name,
                createdAt: Timestamp.now(),
                createdBy: currentUser.uid,
            });
            const newOption = { value: docRef.id, label: name };
            setCustomers(prev => [...prev, newOption].sort((a, b) => a.label.localeCompare(b.label)));
            setSelectedCustomer(newOption);
            showToast(`✅ Customer "${name}" created and selected!`, 'success', 2500);
        } catch (err) {
            console.error('Failed to create customer:', err);
            setError(`Failed to create customer: ${err.message}`);
        }
        setCreatingCustomer(false);
    };

    const handleAddToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(c => c.id === item.id);
            if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const handleUpdateQuantity = (id, delta) => {
        setCart(prev => prev.map(c => {
            if (c.id === id) {
                const newQ = c.quantity + delta;
                return newQ > 0 ? { ...c, quantity: newQ } : c;
            }
            return c;
        }));
    };

    const handleRemoveFromCart = (id) => {
        setCart(prev => prev.filter(c => c.id !== id));
    };

    const handleSetQuantity = (id, rawValue) => {
        // Allow clearing the field while typing (store as empty string temporarily)
        if (rawValue === '' || rawValue === '0') return;
        const parsed = parseInt(rawValue, 10);
        if (isNaN(parsed) || parsed < 1) return;
        setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: parsed } : c));
    };

    const cartTotalCents = cart.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);

    const handleCheckout = async () => {
        if (cartTotalCents <= 0) { setError("Cart is empty."); return; }
        if (saleType === 'credit' && !selectedCustomer) { setError("Please select a Customer for a Credit Sale."); return; }

        setProcessing(true);
        setError('');

        try {
            // Calculate discount
            const discountCents = Math.round((parseFloat(discountValue) || 0) * 100);
            const payableTotal = cartTotalCents - discountCents;

            if (payableTotal < 0) throw new Error("Discount cannot exceed total.");

            const isReturn = saleType === 'return';
            const debitAccount = isReturn ? '4060_returns' : (saleType === 'cash' ? '1000_cash' : '1200_ar');
            const creditAccount = isReturn ? (selectedCustomer ? '1200_ar' : '1000_cash') : null;

            // Group items by their revenue_account and build one credit line per account
            const revenueGroups = {};
            cart.forEach(c => {
                const acct = c.revenue_account || '4000_revenue';
                revenueGroups[acct] = (revenueGroups[acct] || 0) + (c.price_cents * c.quantity);
            });

            const lines = [
                { account_id: debitAccount, debit: payableTotal, credit: 0 },
                ...(!isReturn && discountCents > 0 ? [{ account_id: '4050_discounts', debit: discountCents, credit: 0 }] : []),
                ...Object.entries(revenueGroups).map(([acct, cents]) => (
                    { account_id: acct, debit: 0, credit: isReturn ? 0 : cents }
                )),
                ...(isReturn ? [{ account_id: creditAccount, debit: 0, credit: payableTotal }] : [])
            ];

            if (!isBalanced(lines.map(l => l.debit - l.credit))) throw new Error("Journal entry not balanced.");

            const { createJournalEntry, processInvoiceReturn } = await import('../../services/journalService');
            const status = isReturn ? 'paid' : (saleType === 'cash' ? 'paid' : 'unpaid');
            const outstanding = isReturn ? (selectedCustomer ? -payableTotal : 0) : (saleType === 'cash' ? 0 : payableTotal);
            const itemsMeta = cart.map(c => `${c.quantity}x ${c.name}`).join(', ');
            const journalType = isReturn ? 'sales_return' : (saleType === 'cash' ? 'cash_sale' : 'credit_sale');

            // Reference Number Logic
            let refNo = manualRefNo.trim();
            if (!refNo) {
                if (isReturn) {
                    refNo = `RET-${Date.now().toString().slice(-6)}`;
                } else {
                    refNo = saleType === 'cash'
                        ? await getNextReceiptNumber(tenantId)
                        : await getNextInvoiceNumber(tenantId);
                }
            }

            const customTimestamp = Timestamp.fromDate(new Date(saleDate + 'T12:00:00'));

            if (isReturn && selectedInvoice) {
                await processInvoiceReturn(tenantId, selectedInvoice.value, payableTotal, {
                    created_by: currentUser.uid,
                    refNo: refNo,
                    customer_name: selectedCustomer ? selectedCustomer.label : 'Walk-in Customer',
                    customer_id: selectedCustomer ? selectedCustomer.value : null,
                    items_summary: itemsMeta,
                    items: cart.map(c => ({ id: c.id, name: c.name, price_cents: c.price_cents, quantity: c.quantity })),
                    subtotal_cents: cartTotalCents
                });
            } else {
                await createJournalEntry(tenantId, journalType, status, refNo, payableTotal, outstanding, lines, {
                    created_by: currentUser.uid,
                    type: isReturn ? 'pos_return' : (saleType === 'cash' ? 'pos_cash' : 'pos_credit'),
                    customer_name: selectedCustomer ? selectedCustomer.label : 'Walk-in Customer',
                    customer_id: selectedCustomer ? selectedCustomer.value : null,
                    items_summary: itemsMeta,
                    items: cart.map(c => ({ id: c.id, name: c.name, price_cents: c.price_cents, quantity: c.quantity })),
                    customDate: customTimestamp,
                    discount_cents: isReturn ? 0 : discountCents,
                    subtotal_cents: cartTotalCents
                });
            }

            showToast(
                isReturn
                    ? `🔄 Return of $${toDollarsData(payableTotal)} processed!`
                    : (saleType === 'cash'
                        ? `✅ Cash sale of $${toDollarsData(payableTotal)} recorded!`
                        : `🧾 Invoice of $${toDollarsData(payableTotal)} generated for ${selectedCustomer.label}!`),
                'success'
            );

            setReceiptData({
                number: refNo,
                date: customTimestamp.toDate().toISOString(),
                items: [...cart],
                total: payableTotal,
                discount: discountCents,
                subtotal: cartTotalCents,
                customer: selectedCustomer ? selectedCustomer.label : null,
                type: saleType
            });

            setCart([]);
            setSelectedCustomer(null);
            setDiscountValue('');
            setManualRefNo('');

        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to process checkout.");
        }
        setProcessing(false);
    };

    if (loading) return (
        <div className="has-text-centered" style={{ padding: '5rem' }}>
            <span className="button is-loading is-white is-large"></span>
            <p className="mt-3 has-text-grey">Loading inventory...</p>
        </div>
    );

    return (
        <div>
            {ToastComponent}

            {/* Header bar */}
            <div className="level is-mobile mb-5">
                <div className="level-left">
                    <button className="button is-medium is-primary is-light" onClick={goBack} style={{ gap: '8px' }}>
                        <span className="icon"><ArrowLeftBold size={18} /></span>
                        <span>Back</span>
                    </button>
                </div>
                <div className="level-right">
                    <div>
                        <h2 className="title is-4 mb-0" style={{ fontWeight: 800 }}>
                            {saleType === 'cash' ? '💵 Cash Sale' : (saleType === 'return' ? '🔄 Sales Return' : '🧾 Credit Sale / Invoice')}
                        </h2>
                        <p className="has-text-grey is-size-7">
                            {saleType === 'cash' ? 'Payments received immediately' : (saleType === 'return' ? 'Refund or Credit Note' : 'Invoice will appear in AR / AP')}
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="notification is-danger is-light mb-4" style={{ borderRadius: '10px' }}>
                    <button className="delete" onClick={() => setError('')}></button>
                    {error}
                </div>
            )}

            {/* Transaction Details (Customer, Date, Ref) */}
            <div className="box mb-4" style={{
                background: saleType === 'credit' ? '#eff6ff' : '#f8fafc',
                border: saleType === 'credit' ? '2px solid #dbeafe' : '1px solid #e2e8f0'
            }}>
                <div className="columns is-multiline">
                    <div className="column is-12">
                        <label className="label">
                            <span className="icon mr-1"><BoxBold size={14} /></span>
                            Customer Account {saleType === 'credit' && <span className="has-text-danger">*</span>}
                        </label>
                        <CreatableSelect
                            options={customers}
                            value={selectedCustomer}
                            onChange={setSelectedCustomer}
                            onCreateOption={handleCreateCustomer}
                            isLoading={creatingCustomer}
                            isDisabled={creatingCustomer}
                            placeholder={saleType === 'cash' ? "Select customer (optional)..." : "Search or type a new customer name..."}
                            isClearable
                            formatCreateLabel={(inputValue) => (
                                <span>
                                    <strong>➕ Add new customer:</strong> "{inputValue}"
                                </span>
                            )}
                            noOptionsMessage={() => 'Type a customer name to search or create'}
                        />
                        {saleType === 'credit' && <p className="help mt-2">Required for credit sales / invoices.</p>}
                    </div>

                    <div className="column is-6">
                        <label className="label">Transaction Date</label>
                        <div className="control">
                            <input
                                className="input"
                                type="date"
                                value={saleDate}
                                onChange={(e) => setSaleDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="column is-6">
                        <label className="label">Manual {saleType === 'cash' ? 'Receipt' : (saleType === 'return' ? 'Return' : 'Bill')} # (Optional)</label>
                        <div className="control">
                            <input
                                className="input"
                                type="text"
                                placeholder={saleType === 'cash' ? "e.g. REC-001" : (saleType === 'return' ? "e.g. RET-001" : "e.g. INV-101")}
                                value={manualRefNo}
                                onChange={(e) => setManualRefNo(e.target.value)}
                            />
                        </div>
                    </div>

                    {saleType === 'return' && selectedCustomer && (
                        <div className="column is-12">
                            <label className="label">Apply Return to Outstanding Invoice</label>
                            <div className="control">
                                <Select
                                    options={customerInvoices}
                                    value={selectedInvoice}
                                    onChange={setSelectedInvoice}
                                    placeholder={customerInvoices.length > 0 ? "Select an invoice..." : "No outstanding invoices found"}
                                    isClearable
                                />
                            </div>
                            {customerInvoices.length > 0 && <p className="help">Linking to an invoice will reduce its outstanding balance directly.</p>}
                        </div>
                    )}
                </div>
            </div>

            <div className="columns is-desktop">
                {/* ─── Left: Item Selection ─── */}
                <div className="column is-7">
                    {quickItems.length > 0 && (
                        <>
                            <h3 className="title is-5 mb-3" style={{ fontWeight: 700 }}>
                                <span className="icon mr-2"><BoxBold size={18} /></span>
                                Quick Add
                            </h3>
                            <div className="columns is-mobile is-multiline mb-5">
                                {quickItems.map(item => (
                                    <div className="column is-6-mobile is-4-tablet is-3-desktop" key={item.id}>
                                        <button
                                            className="button pos-item-btn"
                                            style={{
                                                height: '100px',
                                                width: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                borderRadius: '14px',
                                                background: '#f0fdf9',
                                                whiteSpace: 'normal',
                                                gap: '4px',
                                                padding: '10px',
                                            }}
                                            onClick={() => handleAddToCart(item)}
                                        >
                                            <strong style={{ fontSize: '0.95rem', color: '#1a202c' }}>{item.name}</strong>
                                            <span style={{ fontSize: '0.85rem', color: '#00b894', fontWeight: 700 }}>${toDollarsData(item.price_cents)}</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <h3 className="title is-5 mb-3" style={{ fontWeight: 700 }}>
                        <span className="icon mr-2"><NotesBold size={18} /></span>
                        Search All Items
                    </h3>
                    <Select
                        options={allItemsOptions}
                        onChange={(selected) => selected && handleAddToCart(selected.item)}
                        placeholder="Find any item by name..."
                        value={null}
                    />

                    {items.length === 0 && (
                        <div className="empty-state mt-5">
                            <span className="empty-emoji">📦</span>
                            <p className="empty-title">No items in inventory</p>
                            <p className="empty-subtitle">Go to Admin → Items to add products with prices.</p>
                        </div>
                    )}
                </div>

                {/* ─── Right: Cart ─── */}
                <div className="column is-5">
                    <div className="box" style={{ border: '2px solid #00b894', display: 'flex', flexDirection: 'column', minHeight: '400px', padding: '1.25rem' }}>
                        <div className="level is-mobile mb-3">
                            <div className="level-left">
                                <h3 className="title is-5 mb-0" style={{ fontWeight: 700 }}>
                                    <span className="icon mr-1"><CartLargeMinimalisticBold size={20} /></span>
                                    Cart
                                </h3>
                            </div>
                            {cartCount > 0 && (
                                <div className="level-right">
                                    <span className="tag is-primary is-rounded is-medium">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
                                </div>
                            )}
                        </div>

                        {/* Cart items */}
                        <div style={{ flexGrow: 1, overflowY: 'auto', minHeight: '250px' }}>
                            {cart.length === 0 ? (
                                <div className="empty-state" style={{ padding: '2rem' }}>
                                    <span className="empty-emoji">🧺</span>
                                    <p className="empty-title">Nothing in the cart yet!</p>
                                    <p className="empty-subtitle">Select items on the left to add them.</p>
                                </div>
                            ) : (
                                <table className="table is-fullwidth" style={{ background: 'transparent' }}>
                                    <tbody>
                                        {cart.map(c => (
                                            <tr key={c.id}>
                                                <td style={{ verticalAlign: 'middle', width: '40%', paddingLeft: 0 }}>
                                                    <strong style={{ fontSize: '0.9rem' }}>{c.name}</strong><br />
                                                    <span className="has-text-grey is-size-7">${toDollarsData(c.price_cents)} ea</span>
                                                </td>
                                                <td style={{ verticalAlign: 'middle', width: '30%' }}>
                                                    <div className="field has-addons" style={{ justifyContent: 'center', marginBottom: 0 }}>
                                                        <p className="control">
                                                            <button className="button is-small" onClick={() => handleUpdateQuantity(c.id, -1)}><MinusCircleBold size={14} /></button>
                                                        </p>
                                                        <p className="control">
                                                            <input
                                                                className="input is-small has-text-centered"
                                                                type="number"
                                                                min="1"
                                                                value={c.quantity}
                                                                onChange={(e) => handleSetQuantity(c.id, e.target.value)}
                                                                style={{ width: '52px' }}
                                                            />
                                                        </p>
                                                        <p className="control">
                                                            <button className="button is-small" onClick={() => handleUpdateQuantity(c.id, 1)}><AddCircleBold size={14} /></button>
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="has-text-right has-text-weight-bold" style={{ verticalAlign: 'middle', width: '20%', color: '#00b894' }}>
                                                    ${toDollarsData(c.price_cents * c.quantity)}
                                                </td>
                                                <td style={{ verticalAlign: 'middle', width: '10%', paddingRight: 0 }}>
                                                    <button className="delete" onClick={() => handleRemoveFromCart(c.id)}></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Total & Checkout */}
                        <div className="is-sticky-bottom" style={{ margin: '-1.25rem', borderRadius: '0 0 12px 12px', marginTop: '1rem' }}>
                            <div className="field mb-3">
                                <label className="label is-small">Discount Amount ($)</label>
                                <div className="control">
                                    <input
                                        className="input is-small"
                                        type="number"
                                        placeholder="0.00"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="level is-mobile mb-3">
                                <div className="level-left">
                                    <span className="title is-4 mb-0">{saleType === 'return' ? 'Return Value' : 'Total'}</span>
                                </div>
                                <div className="level-right">
                                    <span className="title is-3 mb-0" style={{ color: saleType === 'return' ? '#e53e3e' : '#00b894', fontWeight: 800 }}>
                                        ${toDollarsData(cartTotalCents - (saleType === 'return' ? 0 : Math.round((parseFloat(discountValue) || 0) * 100)))}
                                    </span>
                                </div>
                            </div>
                            <button
                                className={`button ${saleType === 'return' ? 'is-danger' : 'is-primary'} is-large is-fullwidth ${processing ? 'is-loading' : ''}`}
                                disabled={cart.length === 0 || processing}
                                onClick={handleCheckout}
                                style={{ borderRadius: '12px', height: '72px', fontSize: '1.2rem', fontWeight: 700 }}
                            >
                                <span className="icon is-large mr-2">
                                    {saleType === 'return' ? <AddCircleBold size={28} /> : <HandMoneyBold size={28} />}
                                </span>
                                <span>
                                    {saleType === 'return'
                                        ? 'Process Return'
                                        : (saleType === 'cash' ? 'Complete Cash Sale' : 'Generate Invoice')}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            <ReceiptModal
                isActive={!!receiptData}
                receipt={receiptData}
                onClose={() => {
                    setReceiptData(null);
                    goBack();
                }}
            />
        </div>
    );
}

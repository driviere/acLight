import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toDollarsData, isBalanced } from '../../utils/moneyUtils';
import Select from 'react-select';
import { HandMoneyBold, CartLargeMinimalisticBold, TrashBinMinimalisticBold, AddCircleBold, MinusCircleBold, NotesBold, BoxBold } from 'solar-icon-set';

export default function POSCart({ saleType, goBack }) {
    const { currentUser } = useAuth();
    const [items, setItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [cart, setCart] = useState([]);

    // Credit Sale Specific State
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [itemsSnap, custSnap] = await Promise.all([
                    getDocs(collection(db, 'items')),
                    saleType === 'credit' ? getDocs(collection(db, 'customers')) : null
                ]);

                setItems(itemsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                if (saleType === 'credit') {
                    const cList = custSnap.docs.map(d => ({ value: d.id, label: d.data().name }));
                    setCustomers(cList.sort((a, b) => a.label.localeCompare(b.label)));
                }

            } catch (err) {
                console.error("Error fetching POS data", err);
                setError("Failed to load inventory.");
            }
            setLoading(false);
        };
        fetchData();
    }, [saleType]);

    const quickItems = items.filter(i => i.is_quick_access).sort((a, b) => a.name.localeCompare(b.name));
    const allItemsOptions = items.map(i => ({ value: i.id, label: `${i.name} ($${toDollarsData(i.price_cents)})`, item: i }));

    const handleAddToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(c => c.id === item.id);
            if (existing) {
                return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
            }
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

    const cartTotalCents = cart.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);

    const handleCheckout = async () => {
        if (cartTotalCents <= 0) {
            setError("Cart is empty.");
            return;
        }

        if (saleType === 'credit' && !selectedCustomer) {
            setError("You must select a Customer for a Credit Sale.");
            return;
        }

        setProcessing(true);
        setError('');

        try {
            // 1. Build the Double-Entry Journal Lines
            const lines = [];

            // Debit: Cash (if cash sale) OR AR (if credit sale)
            const debitAccount = saleType === 'cash' ? '1000_cash' : '1200_ar';
            lines.push({ account_id: debitAccount, debit: cartTotalCents, credit: 0 });

            // Credit: Group sales by general revenue for now (4000_sales_bread as fallback, or map by item type if desired)
            // For simplicity in this bakery, we'll route all general POS items to a single generic sales account, 
            // or we could iterate. Let's send it all to 4000_sales_bread as a generic revenue for this example.
            // A more advanced system would have an income_account_id on the Item document itself.
            lines.push({ account_id: '4000_sales_bread', debit: 0, credit: cartTotalCents });

            if (!isBalanced(lines.map(l => l.debit - l.credit))) {
                throw new Error("Critical Error: Journal entry not balanced.");
            }

            // 2. Create the journal entry via our robust atomic service
            const { createJournalEntry } = await import('../../services/journalService');

            const status = saleType === 'cash' ? 'paid' : 'unpaid';
            const outstanding = saleType === 'cash' ? 0 : cartTotalCents;
            const itemsMeta = cart.map(c => `${c.quantity}x ${c.name}`).join(', ');

            await createJournalEntry(
                'sale',
                status,
                `POS-${Date.now()}`,
                cartTotalCents,
                outstanding,
                lines,
                {
                    created_by: currentUser.uid,
                    type: saleType === 'cash' ? 'pos_cash' : 'pos_credit',
                    customer_name: selectedCustomer ? selectedCustomer.label : 'Walk-in Customer',
                    customer_id: selectedCustomer ? selectedCustomer.value : null,
                    items_summary: itemsMeta
                }
            );

            // Success Wipe
            setCart([]);
            setSelectedCustomer(null);
            alert("Checkout Successful!");
            goBack();

        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to process checkout.");
        }
        setProcessing(false);
    };


    if (loading) return <div className="has-text-centered mt-5"><span className="button is-loading is-white is-large"></span></div>;

    return (
        <div className="box">
            {error && <div className="notification is-danger">{error}</div>}

            <div className="level is-mobile mb-4">
                <div className="level-left">
                    <button className="button is-light" onClick={goBack}>&larr; Back to Selection</button>
                </div>
                <div className="level-right">
                    <h2 className="title is-4 has-text-primary mb-0">
                        {saleType === 'cash' ? 'Register: Cash Sale' : 'Register: Credit / Invoice Sale'}
                    </h2>
                </div>
            </div>

            {saleType === 'credit' && (
                <div className="field mb-5 p-3 has-background-white-ter" style={{ borderRadius: '8px' }}>
                    <label className="label">Customer Account</label>
                    <Select
                        options={customers}
                        value={selectedCustomer}
                        onChange={setSelectedCustomer}
                        placeholder="Search for customer..."
                        isClearable
                    />
                    <p className="help">To add a new customer, close the POS and visit the Admin page.</p>
                </div>
            )}

            <div className="columns is-desktop">
                {/* Left Side: Product Selection */}
                <div className="column is-7">
                    <h3 className="title is-5"><span className="icon mr-2"><BoxBold /></span>Quick Add</h3>
                    <div className="columns is-mobile is-multiline">
                        {quickItems.map(item => (
                            <div className="column is-4-mobile is-4-tablet is-3-desktop" key={item.id}>
                                <button
                                    className="button is-white full-height-button has-background-primary-light has-text-primary-dark"
                                    style={{ height: '100px', width: '100%', display: 'flex', flexDirection: 'column', whiteSpace: 'normal', borderRadius: '12px', border: '2px solid transparent' }}
                                    onClick={() => handleAddToCart(item)}
                                >
                                    <strong style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{item.name}</strong>
                                    <span>${toDollarsData(item.price_cents)}</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    <h3 className="title is-5 mt-5"><span className="icon mr-2"><NotesBold /></span>Search All Items</h3>
                    <Select
                        options={allItemsOptions}
                        onChange={(selected) => selected && handleAddToCart(selected.item)}
                        placeholder="Find any item by name or SKU..."
                        value={null} // Keep it empty after selection so it acts like a search bar
                    />
                </div>

                {/* Right Side: Cart */}
                <div className="column is-5">
                    <div className="box has-background-white-ter" style={{ border: '2px solid #00d1b2', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <h3 className="title is-5 has-text-primary mb-4">
                            <span className="icon mr-2"><CartLargeMinimalisticBold /></span>
                            Current Cart
                        </h3>

                        <div style={{ flexGrow: 1, overflowY: 'auto', minHeight: '300px' }}>
                            {cart.length === 0 ? (
                                <p className="has-text-grey has-text-centered mt-6">Cart is empty. Select items to begin.</p>
                            ) : (
                                <table className="table is-fullwidth is-transparent" style={{ backgroundColor: 'transparent' }}>
                                    <tbody>
                                        {cart.map(c => (
                                            <tr key={c.id}>
                                                <td style={{ verticalAlign: 'middle', width: '40%' }}>
                                                    <strong>{c.name}</strong><br />
                                                    <span className="has-text-grey is-size-7">${toDollarsData(c.price_cents)} ea</span>
                                                </td>
                                                <td style={{ verticalAlign: 'middle', width: '30%' }}>
                                                    <div className="field has-addons is-justify-content-center">
                                                        <p className="control">
                                                            <button className="button is-small" onClick={() => handleUpdateQuantity(c.id, -1)}><MinusCircleBold /></button>
                                                        </p>
                                                        <p className="control">
                                                            <input className="input is-small has-text-centered" type="text" readOnly value={c.quantity} style={{ width: '40px' }} />
                                                        </p>
                                                        <p className="control">
                                                            <button className="button is-small" onClick={() => handleUpdateQuantity(c.id, 1)}><AddCircleBold /></button>
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="has-text-right has-text-weight-bold" style={{ verticalAlign: 'middle', width: '20%' }}>
                                                    ${toDollarsData(c.price_cents * c.quantity)}
                                                </td>
                                                <td className="has-text-right" style={{ verticalAlign: 'middle', width: '10%' }}>
                                                    <button className="delete is-medium has-background-danger" onClick={() => handleRemoveFromCart(c.id)}></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <hr className="has-background-primary-light" />

                        <div className="level is-mobile mb-4">
                            <div className="level-left"><h2 className="title is-3 mb-0">Total</h2></div>
                            <div className="level-right"><h2 className="title is-3 has-text-primary mb-0">${toDollarsData(cartTotalCents)}</h2></div>
                        </div>

                        <button
                            className={`button is-primary is-large is-fullwidth ${processing ? 'is-loading' : ''}`}
                            disabled={cart.length === 0 || processing}
                            onClick={handleCheckout}
                            style={{ borderRadius: '12px', height: '80px', fontSize: '1.5rem' }}
                        >
                            <span className="icon is-large mr-2"><HandMoneyBold size={32} /></span>
                            <span>{saleType === 'cash' ? 'Complete Cash Sale' : 'Generate Invoice'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

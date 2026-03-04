import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toDollarsData, toCents } from '../../utils/moneyUtils';
import { BoxBold, AddCircleBold, TrashBinMinimalisticBold, PenBold } from 'solar-icon-set';

export default function ItemManager() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [sku, setSku] = useState('');
    const [isQuickAccess, setIsQuickAccess] = useState(false);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'items'));
            const itemsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(itemsList.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'items'), {
                name,
                price_cents: toCents(price),
                sku: sku || name.substring(0, 4).toUpperCase(),
                is_quick_access: isQuickAccess
            });
            setName('');
            setPrice('');
            setSku('');
            setIsQuickAccess(false);
            fetchItems();
        } catch (error) {
            console.error(error);
            alert("Error adding item");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this specific SKU?")) {
            await deleteDoc(doc(db, 'items', id));
            fetchItems();
        }
    };

    return (
        <div className="box">
            <h2 className="title is-4 has-text-primary">
                <span className="icon mr-2"><BoxBold size={24} /></span>
                Inventory & POS Items
            </h2>

            <form onSubmit={handleAdd} className="mb-5 p-4 has-background-white-ter" style={{ borderRadius: '8px' }}>
                <div className="columns is-multiline">
                    <div className="column is-4">
                        <label className="label">Item Name</label>
                        <input className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. White Mastiff" />
                    </div>
                    <div className="column is-3">
                        <label className="label">Price ($)</label>
                        <input className="input" type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} required placeholder="e.g. 5.50" />
                    </div>
                    <div className="column is-3">
                        <label className="label">SKU (Opt)</label>
                        <input className="input" value={sku} onChange={e => setSku(e.target.value)} placeholder="WHT-MSTF" />
                    </div>
                    <div className="column is-2 is-flex is-align-items-flex-end">
                        <label className="checkbox mb-2">
                            <input type="checkbox" checked={isQuickAccess} onChange={e => setIsQuickAccess(e.target.checked)} className="mr-2" />
                            <strong>POS Big Button</strong>
                        </label>
                    </div>
                    <div className="column is-12">
                        <button className="button is-primary" type="submit">
                            <span className="icon"><AddCircleBold /></span>
                            <span>Add New Item</span>
                        </button>
                    </div>
                </div>
            </form>

            {loading ? <p>Loading items...</p> : (
                <div className="table-container">
                    <table className="table is-fullwidth is-hoverable is-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>SKU</th>
                                <th>Price</th>
                                <th>Quick Access</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id}>
                                    <td>{item.name}</td>
                                    <td>{item.sku}</td>
                                    <td>${toDollarsData(item.price_cents)}</td>
                                    <td>{item.is_quick_access ? <span className="tag is-success">Yes</span> : <span className="tag is-light">No</span>}</td>
                                    <td>
                                        <button className="button is-danger is-small is-light" onClick={() => handleDelete(item.id)}>
                                            <span className="icon"><TrashBinMinimalisticBold size={14} /></span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

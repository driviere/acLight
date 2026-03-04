import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UsersGroupTwoRoundedBold, AddCircleBold, TrashBinMinimalisticBold } from 'solar-icon-set';

export default function CustomerManager() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'customers'));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCustomers(list.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'customers'), { name, phone, email });
            setName('');
            setPhone('');
            setEmail('');
            fetchCustomers();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete customer?")) {
            await deleteDoc(doc(db, 'customers', id));
            fetchCustomers();
        }
    };

    return (
        <div className="box">
            <h2 className="title is-4 has-text-info">
                <span className="icon mr-2"><UsersGroupTwoRoundedBold size={24} /></span>
                Customer Accounts (AR)
            </h2>

            <form onSubmit={handleAdd} className="mb-5 p-4 has-background-white-ter" style={{ borderRadius: '8px' }}>
                <div className="columns is-multiline">
                    <div className="column is-4">
                        <label className="label">Business / Customer Name</label>
                        <input className="input" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="column is-4">
                        <label className="label">Phone</label>
                        <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <div className="column is-4">
                        <label className="label">Email</label>
                        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="column is-12">
                        <button className="button is-info" type="submit">
                            <span className="icon"><AddCircleBold /></span>
                            <span>Add Customer</span>
                        </button>
                    </div>
                </div>
            </form>

            {loading ? <p>Loading...</p> : (
                <div className="table-container">
                    <table className="table is-fullwidth is-hoverable is-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(c => (
                                <tr key={c.id}>
                                    <td><strong>{c.name}</strong></td>
                                    <td>{c.phone}</td>
                                    <td>{c.email}</td>
                                    <td>
                                        <button className="button is-danger is-small is-light" onClick={() => handleDelete(c.id)}>
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

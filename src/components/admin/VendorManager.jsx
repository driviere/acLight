import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTenant } from '../../contexts/TenantContext';
import { BuildingsBold, AddCircleBold, TrashBinMinimalisticBold } from 'solar-icon-set';

export default function VendorManager() {
    const { tenantId } = useTenant();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');

    const fetchVendors = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'tenants', tenantId, 'vendors'));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVendors(list.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchVendors();
    }, [tenantId]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!tenantId) return;
        try {
            await addDoc(collection(db, 'tenants', tenantId, 'vendors'), { name, contactInfo: contact });
            setName('');
            setContact('');
            fetchVendors();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete vendor?")) {
            await deleteDoc(doc(db, 'tenants', tenantId, 'vendors', id));
            fetchVendors();
        }
    };

    return (
        <div className="box">
            <h2 className="title is-4 has-text-danger">
                <span className="icon mr-2"><BuildingsBold size={24} /></span>
                Vendor Accounts (AP)
            </h2>

            <form onSubmit={handleAdd} className="mb-5 p-4 has-background-white-ter" style={{ borderRadius: '8px' }}>
                <div className="columns is-multiline">
                    <div className="column is-6">
                        <label className="label">Vendor / Supplier Name</label>
                        <input className="input" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="column is-6">
                        <label className="label">Contact Info / Account #</label>
                        <input className="input" value={contact} onChange={e => setContact(e.target.value)} />
                    </div>
                    <div className="column is-12">
                        <button className="button is-danger" type="submit">
                            <span className="icon"><AddCircleBold /></span>
                            <span>Add Vendor</span>
                        </button>
                    </div>
                </div>
            </form>

            {loading ? <p>Loading...</p> : (
                <div className="table-container">
                    <table className="table is-fullwidth is-hoverable is-striped bl-table-responsive">
                        <thead>
                            <tr>
                                <th>Vendor Name</th>
                                <th>Contact Details</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.map(v => (
                                <tr key={v.id}>
                                    <td data-label="Vendor Name"><strong>{v.name}</strong></td>
                                    <td data-label="Contact Details">{v.contactInfo}</td>
                                    <td data-label="Actions">
                                        <button className="button is-danger is-small is-light" onClick={() => handleDelete(v.id)}>
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

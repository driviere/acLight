import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { toDollarsData } from '../../utils/moneyUtils';
import { DocumentTextBold, BillBold } from 'solar-icon-set';

export default function OutstandingList() {
    const [apInvoices, setApInvoices] = useState([]);
    const [arInvoices, setArInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOutstanding = async () => {
            try {
                // Fetch unpaid or partial journal entries
                const q = query(collection(db, 'journal_entries'), where('status', 'in', ['unpaid', 'partial']));
                const querySnapshot = await getDocs(q);

                let apList = [];
                let arList = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const invoice = { id: doc.id, ...data };

                    if (data.type === 'sale') {
                        arList.push(invoice);
                    } else if (data.type === 'purchase') {
                        apList.push(invoice);
                    }
                });

                // Sort by date descending
                setApInvoices(apList.sort((a, b) => b.date.seconds - a.date.seconds));
                setArInvoices(arList.sort((a, b) => b.date.seconds - a.date.seconds));
            } catch (error) {
                console.error("Error fetching outstanding lists:", error);
            }
            setLoading(false);
        };

        fetchOutstanding();
    }, []);

    if (loading) {
        return <div className="box has-text-centered"><span className="button is-loading is-white is-large"></span></div>;
    }

    return (
        <div className="columns is-desktop mt-4">
            <div className="column is-half">
                <div className="box has-background-danger-light" style={{ borderRadius: '12px', height: '100%' }}>
                    <h3 className="title is-5 has-text-danger mb-4">
                        <span className="icon mr-2"><BillBold size={20} /></span>
                        Unpaid Vendor Bills (We Owe)
                    </h3>
                    {apInvoices.length === 0 ? (
                        <p className="has-text-grey">No outstanding bills.</p>
                    ) : (
                        <div className="table-container">
                            <table className="table is-fullwidth is-hoverable has-background-danger-light">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Vendor</th>
                                        <th className="has-text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apInvoices.map(inv => {
                                        const dateStr = inv.date?.seconds ? new Date(inv.date.seconds * 1000).toLocaleDateString() : 'N/A';
                                        return (
                                            <tr key={inv.id}>
                                                <td>{dateStr}</td>
                                                <td>{inv.metadata?.vendor_name || 'Unknown'}</td>
                                                <td className="has-text-right has-text-danger has-text-weight-bold">
                                                    ${toDollarsData(inv.outstanding_cents)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="column is-half">
                <div className="box has-background-link-light" style={{ borderRadius: '12px', height: '100%' }}>
                    <h3 className="title is-5 has-text-link mb-4">
                        <span className="icon mr-2"><DocumentTextBold size={20} /></span>
                        Unpaid Customer Invoices (Owed To Us)
                    </h3>
                    {arInvoices.length === 0 ? (
                        <p className="has-text-grey">No outstanding invoices.</p>
                    ) : (
                        <div className="table-container">
                            <table className="table is-fullwidth is-hoverable has-background-link-light">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th className="has-text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {arInvoices.map(inv => {
                                        const dateStr = inv.date?.seconds ? new Date(inv.date.seconds * 1000).toLocaleDateString() : 'N/A';
                                        return (
                                            <tr key={inv.id}>
                                                <td>{dateStr}</td>
                                                <td>{inv.metadata?.customer_name || 'Counter Sale'}</td>
                                                <td className="has-text-right has-text-link has-text-weight-bold">
                                                    ${toDollarsData(inv.outstanding_cents)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { toDollarsData } from '../../utils/moneyUtils';
import { WalletBold, CardSendBold } from 'solar-icon-set';

export default function OutstandingMonitor() {
    const [apCents, setApCents] = useState(0);
    const [arCents, setArCents] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOutstanding = async () => {
            try {
                // Fetch unpaid or partial journal entries
                const q = query(collection(db, 'journal_entries'), where('status', 'in', ['unpaid', 'partial']));
                const querySnapshot = await getDocs(q);

                let tempAp = 0;
                let tempAr = 0;

                querySnapshot.forEach((doc) => {
                    const data = doc.data();

                    // Sales that are unpaid -> Money owed TO us (AR)
                    if (data.type === 'sale') {
                        tempAr += data.outstanding_cents || 0;
                    }
                    // Purchases that are unpaid -> Money owed BY us (AP)
                    else if (data.type === 'purchase') {
                        tempAp += data.outstanding_cents || 0;
                    }
                });

                setApCents(tempAp);
                setArCents(tempAr);
            } catch (error) {
                console.error("Error fetching outstanding balances:", error);
            }
            setLoading(false);
        };

        fetchOutstanding();
    }, []);

    if (loading) {
        return <div className="box has-text-centered"><span className="button is-loading is-white is-large"></span></div>;
    }

    return (
        <div className="columns is-mobile is-multiline mt-4">
            <div className="column is-half-mobile is-6-tablet">
                <div className="box has-background-danger-light has-text-centered p-5" style={{ borderRadius: '12px' }}>
                    <span className="icon is-large has-text-danger mb-2"><CardSendBold size={48} /></span>
                    <h3 className="title is-6 mb-1">Total We Owe (AP)</h3>
                    <p className="title is-3 has-text-danger">${toDollarsData(apCents)}</p>
                </div>
            </div>

            <div className="column is-half-mobile is-6-tablet">
                <div className="box has-background-link-light has-text-centered p-5" style={{ borderRadius: '12px' }}>
                    <span className="icon is-large has-text-link mb-2"><WalletBold size={48} /></span>
                    <h3 className="title is-6 mb-1">Total Owed to Us (AR)</h3>
                    <p className="title is-3 has-text-link">${toDollarsData(arCents)}</p>
                </div>
            </div>
        </div>
    );
}

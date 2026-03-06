import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { toDollarsData } from '../../utils/moneyUtils';
import { WalletBold, CardSendBold, ChartBold } from 'solar-icon-set';
import { useTenant } from '../../contexts/TenantContext';

export default function OutstandingMonitor() {
    const [apCents, setApCents] = useState(0);
    const [arCents, setArCents] = useState(0);
    const [loading, setLoading] = useState(true);
    const { tenantId } = useTenant();

    useEffect(() => {
        const fetchOutstanding = async () => {
            try {
                // Fetch unpaid or partial journal entries
                const q = query(collection(db, 'tenants', tenantId, 'journal_entries'), where('status', 'in', ['unpaid', 'partial']));
                const querySnapshot = await getDocs(q);

                let tempAp = 0;
                let tempAr = 0;

                querySnapshot.forEach((doc) => {
                    const data = doc.data();

                    // Sales that are unpaid -> Money owed TO us (AR)
                    if (data.type === 'sale' || data.type === 'credit_sale') {
                        tempAr += data.outstanding_cents || 0;
                    }
                    // Purchases/Expenses that are unpaid -> Money owed BY us (AP)
                    else if (data.type === 'purchase' || data.type === 'expense') {
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

        if (tenantId) {
            fetchOutstanding();
        } else {
            setLoading(false);
        }
    }, [tenantId]);

    if (loading) {
        return <div className="box has-text-centered"><span className="button is-loading is-white is-large"></span></div>;
    }

    return (
        <div className="bl-card-premium p-5 mb-5" style={{ borderRadius: '24px' }}>
            <div className="is-flex is-align-items-center mb-4">
                <span className="icon has-text-primary mr-2"><ChartBold size={24} /></span>
                <h3 className="title is-6 mb-0 is-uppercase has-text-grey" style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>Balance Summary</h3>
            </div>

            <div className="columns is-mobile is-gapless mb-0">
                <div className="column pr-3" style={{ borderRight: '1px solid #f0f3f5' }}>
                    <div className="is-flex is-align-items-center mb-1">
                        <span className="icon is-small has-text-danger mr-2"><CardSendBold size={14} /></span>
                        <span className="is-size-7 has-text-weight-semibold has-text-grey">We Owe</span>
                    </div>
                    <div className="title is-4 has-text-danger mb-0">${toDollarsData(apCents)}</div>
                </div>

                <div className="column pl-3">
                    <div className="is-flex is-align-items-center mb-1">
                        <span className="icon is-small has-text-link mr-2"><WalletBold size={14} /></span>
                        <span className="is-size-7 has-text-weight-semibold has-text-grey">Owed to Us</span>
                    </div>
                    <div className="title is-4 has-text-link mb-0">${toDollarsData(arCents)}</div>
                </div>
            </div>

            <div className="mt-4 pt-3" style={{ borderTop: '1px solid #f0f3f5' }}>
                <div className="is-flex is-justify-content-space-between is-size-7 has-text-grey">
                    <span>Net Position</span>
                    <span className={`has-text-weight-bold ${arCents >= apCents ? 'has-text-success' : 'has-text-danger'}`}>
                        ${toDollarsData(Math.abs(arCents - apCents))} {arCents >= apCents ? 'Positive' : 'Debt'}
                    </span>
                </div>
            </div>
        </div>
    );
}

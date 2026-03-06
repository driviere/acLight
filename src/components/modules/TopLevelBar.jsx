import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { toDollarsData } from '../../utils/moneyUtils';
import { BanknoteBold, BuildingsBold, ChartSquareBold, BillBold } from 'solar-icon-set';
import { useTenant } from '../../contexts/TenantContext';

export default function TopLevelBar() {
    const [assetsCents, setAssetsCents] = useState(0);
    const [liabilitiesCents, setLiabilitiesCents] = useState(0);
    const [revenueCents, setRevenueCents] = useState(0);
    const [expensesCents, setExpensesCents] = useState(0);
    const [loading, setLoading] = useState(true);
    const { tenantId } = useTenant();

    useEffect(() => {
        const fetchBalances = async () => {
            try {
                // Fetch all accounts to separate by type
                const q = query(collection(db, 'tenants', tenantId, 'accounts'));
                const querySnapshot = await getDocs(q);

                let assets = 0;
                let liabilities = 0;
                let revenue = 0;
                let expenses = 0;

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.type === 'asset') assets += data.balance || 0;
                    else if (data.type === 'liability') liabilities += data.balance || 0;
                    else if (data.type === 'revenue') revenue += data.balance || 0;
                    else if (data.type === 'expense') expenses += data.balance || 0;
                });

                setAssetsCents(assets);
                setLiabilitiesCents(liabilities);
                setRevenueCents(revenue);
                setExpensesCents(expenses);
            } catch (error) {
                console.error("Error fetching account balances:", error);
            }
            setLoading(false);
        };

        if (tenantId) {
            fetchBalances();
        } else {
            setLoading(false);
        }
    }, [tenantId]);

    if (loading) {
        return <div className="box has-text-centered p-3 mb-5"><span className="button is-loading is-white"></span></div>;
    }

    const statCard = (icon, label, value, gradClass) => (
        <div className={`bl-card-premium p-4 has-text-white`} style={{
            background: `var(--bl-grad-${gradClass})`,
            minWidth: '140px',
            borderRadius: '16px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
        }}>
            <div className="is-flex is-align-items-center mb-2" style={{ opacity: 0.9 }}>
                <span className="icon is-small mr-2">{icon}</span>
                <span className="is-size-7 has-text-weight-bold is-uppercase" style={{ letterSpacing: '0.5px' }}>{label}</span>
            </div>
            <div className="title is-4 has-text-white" style={{ marginBottom: 0 }}>
                ${toDollarsData(value)}
            </div>
        </div>
    );

    return (
        <div className="mb-5">
            <div className="top-level-stat-container">
                {statCard(<BanknoteBold size={18} />, 'Assets', assetsCents, 'primary')}
                {statCard(<BuildingsBold size={18} />, 'Liabilities', liabilitiesCents, 'danger')}
                {statCard(<ChartSquareBold size={18} />, 'Revenue', revenueCents, 'purple')}
                {statCard(<BillBold size={18} />, 'Expenses', expensesCents, 'warning')}
            </div>
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { toDollarsData } from '../../utils/moneyUtils';
import { BanknoteBold, BuildingsBold, ChartSquareBold, BillBold } from 'solar-icon-set';

export default function TopLevelBar() {
    const [assetsCents, setAssetsCents] = useState(0);
    const [liabilitiesCents, setLiabilitiesCents] = useState(0);
    const [revenueCents, setRevenueCents] = useState(0);
    const [expensesCents, setExpensesCents] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalances = async () => {
            try {
                // Fetch all accounts to separate by type
                const q = query(collection(db, 'accounts'));
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

        fetchBalances();
    }, []);

    if (loading) {
        return <div className="box has-text-centered p-3 mb-5"><span className="button is-loading is-white"></span></div>;
    }

    const statItem = (icon, label, value, colorClass) => (
        <div style={{ textAlign: 'center' }}>
            <p className="heading is-size-7 mb-1 has-text-grey" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <span className="icon is-small">{icon}</span>
                {label}
            </p>
            <p className={`title is-5 ${colorClass}`} style={{ marginBottom: 0 }}>
                ${toDollarsData(value)}
            </p>
        </div>
    );

    return (
        <div className="box mb-5 p-4" style={{ borderRadius: '12px', borderTop: '4px solid #00d1b2' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
            }}
                className="top-level-grid"
            >
                {statItem(<BanknoteBold />, 'Total Assets', assetsCents, 'has-text-success')}
                {statItem(<BuildingsBold />, 'Total Liabilities', liabilitiesCents, 'has-text-danger')}
                {statItem(<ChartSquareBold />, 'Total Revenue', revenueCents, 'has-text-primary')}
                {statItem(<BillBold />, 'Total Expenses', expensesCents, 'has-text-warning')}
            </div>
        </div>
    );
}

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

    return (
        <nav className="level is-mobile box mb-5 p-4" style={{ borderRadius: '12px', borderTop: '4px solid #00d1b2' }}>
            <div className="level-item has-text-centered">
                <div>
                    <p className="heading is-size-7-mobile is-size-6-tablet mb-1 has-text-grey">
                        <span className="icon is-small mr-1"><BanknoteBold /></span>
                        Total Assets
                    </p>
                    <p className="title is-size-4-mobile is-size-3-tablet has-text-success">
                        ${toDollarsData(assetsCents)}
                    </p>
                </div>
            </div>
            <div className="level-item has-text-centered">
                <div>
                    <p className="heading is-size-7-mobile is-size-6-tablet mb-1 has-text-grey">
                        <span className="icon is-small mr-1"><BuildingsBold /></span>
                        Total Liabilities
                    </p>
                    <p className="title is-size-4-mobile is-size-3-tablet has-text-danger">
                        ${toDollarsData(liabilitiesCents)}
                    </p>
                </div>
            </div>
            <div className="level-item has-text-centered">
                <div>
                    <p className="heading is-size-7-mobile is-size-6-tablet mb-1 has-text-grey">
                        <span className="icon is-small mr-1"><ChartSquareBold /></span>
                        Total Revenue
                    </p>
                    <p className="title is-size-4-mobile is-size-3-tablet has-text-primary">
                        ${toDollarsData(revenueCents)}
                    </p>
                </div>
            </div>
            <div className="level-item has-text-centered">
                <div>
                    <p className="heading is-size-7-mobile is-size-6-tablet mb-1 has-text-grey">
                        <span className="icon is-small mr-1"><BillBold /></span>
                        Total Expenses
                    </p>
                    <p className="title is-size-4-mobile is-size-3-tablet has-text-warning">
                        ${toDollarsData(expensesCents)}
                    </p>
                </div>
            </div>
        </nav>
    );
}

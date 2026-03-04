import React, { useState } from 'react';
import POSCart from './POSCart';
import { HandMoneyBold, UsersGroupTwoRoundedBold } from 'solar-icon-set';

export default function POSDashboard() {
    // Determine which mode the POS is in: null (selection screen), 'cash', or 'credit'
    const [saleMode, setSaleMode] = useState(null);

    // If a mode is selected, show the unified POS cart configured for that type
    if (saleMode) {
        return <POSCart saleType={saleMode} goBack={() => setSaleMode(null)} />;
    }

    // Default Selection Screen
    return (
        <div className="columns is-centered mt-6 mb-6">
            <div className="column is-5">
                <button
                    className="button is-success is-large is-fullwidth"
                    onClick={() => setSaleMode('cash')}
                    style={{ height: '300px', display: 'flex', flexDirection: 'column', borderRadius: '24px' }}
                >
                    <span className="icon" style={{ height: '100px', width: '100px', marginBottom: '20px' }}>
                        <HandMoneyBold size={96} />
                    </span>
                    <span className="title is-2 has-text-white mb-0">CASH SALE</span>
                    <span className="subtitle is-5 has-text-white mt-2">Walk-in Customer / Register</span>
                </button>
            </div>

            <div className="column is-5">
                <button
                    className="button is-info is-large is-fullwidth"
                    onClick={() => setSaleMode('credit')}
                    style={{ height: '300px', display: 'flex', flexDirection: 'column', borderRadius: '24px' }}
                >
                    <span className="icon" style={{ height: '100px', width: '100px', marginBottom: '20px' }}>
                        <UsersGroupTwoRoundedBold size={96} />
                    </span>
                    <span className="title is-2 has-text-white mb-0">CREDIT SALE</span>
                    <span className="subtitle is-5 has-text-white mt-2">Invoice / B2B Account</span>
                </button>
            </div>
        </div>
    );
}

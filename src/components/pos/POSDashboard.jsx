import React, { useState } from 'react';
import POSCart from './POSCart';
import { HandMoneyBold, UsersGroupTwoRoundedBold } from 'solar-icon-set';

export default function POSDashboard() {
    const [saleMode, setSaleMode] = useState(null);

    if (saleMode) {
        return <POSCart saleType={saleMode} goBack={() => setSaleMode(null)} />;
    }

    return (
        <div>
            <div className="has-text-centered mb-5">
                <h2 className="title is-4" style={{ fontWeight: 800, color: '#1a202c' }}>Select Sale Type</h2>
                <p className="subtitle is-6" style={{ color: '#718096' }}>Choose how this transaction will be settled.</p>
            </div>

            <div className="columns is-centered">
                <div className="column is-5-tablet is-4-desktop">
                    <button
                        className="button is-large is-fullwidth pos-mode-btn cash-btn"
                        onClick={() => setSaleMode('cash')}
                        style={{
                            height: '280px',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: '20px',
                            gap: '16px',
                        }}
                    >
                        <span style={{ fontSize: '4rem', lineHeight: 1 }}>💵</span>
                        <div>
                            <div className="title is-3 has-text-white mb-1" style={{ letterSpacing: '-0.5px' }}>CASH SALE</div>
                            <div className="subtitle is-6 has-text-white" style={{ opacity: 0.85 }}>Walk-in Customer · Register</div>
                        </div>
                    </button>
                </div>

                <div className="column is-5-tablet is-4-desktop">
                    <button
                        className="button is-large is-fullwidth pos-mode-btn credit-btn"
                        onClick={() => setSaleMode('credit')}
                        style={{
                            height: '280px',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: '20px',
                            gap: '16px',
                        }}
                    >
                        <span style={{ fontSize: '4rem', lineHeight: 1 }}>🧾</span>
                        <div>
                            <div className="title is-3 has-text-white mb-1" style={{ letterSpacing: '-0.5px' }}>CREDIT SALE</div>
                            <div className="subtitle is-6 has-text-white" style={{ opacity: 0.85 }}>Invoice · B2B Account</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

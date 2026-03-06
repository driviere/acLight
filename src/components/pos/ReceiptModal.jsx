import React from 'react';
import { toDollarsData, formatCurrency } from '../../utils/moneyUtils';
import { PrinterBold, CloseSquareBold } from 'solar-icon-set';

export default function ReceiptModal({ isActive, receipt, onClose }) {
    if (!isActive || !receipt) return null;

    const handlePrint = () => {
        window.print();
    };

    const dateStr = receipt.date ? new Date(receipt.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    return (
        <div className={`modal ${isActive ? 'is-active' : ''}`}>
            <div className="modal-background" onClick={onClose}></div>
            <div className="modal-card" style={{ maxWidth: '400px' }}>
                <header className="modal-card-head is-hidden-print">
                    <p className="modal-card-title has-text-weight-bold">
                        <span className="icon mr-2"><PrinterBold size={20} /></span>
                        Receipt Generated
                    </p>
                    <button className="delete" aria-label="close" onClick={onClose}></button>
                </header>

                <section className="modal-card-body p-0 receipt-print-area" style={{ background: '#fff' }}>
                    <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#000', margin: '0 auto', maxWidth: '350px' }}>
                        {/* Receipt Header */}
                        <div className="has-text-centered mb-4">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Bakery Ledger</h2>
                            <p style={{ fontSize: '0.9rem', color: '#555' }}>123 Pastry Lane<br />Cityville, ST 12345</p>
                            <p style={{ fontSize: '0.9rem', color: '#555' }}>Tel: (555) 123-4567</p>
                            <hr style={{ borderTop: '1px dashed #ccc', margin: '1rem 0' }} />
                        </div>

                        {/* Receipt Meta */}
                        <div className="mb-4" style={{ fontSize: '0.9rem' }}>
                            <div className="is-flex is-justify-content-space-between mb-1">
                                <span>Date:</span>
                                <span>{dateStr}</span>
                            </div>
                            <div className="is-flex is-justify-content-space-between mb-1">
                                <span>Receipt #:</span>
                                <span>{receipt.number}</span>
                            </div>
                            <div className="is-flex is-justify-content-space-between mb-1">
                                <span>Customer:</span>
                                <span>{receipt.customer || 'Walk-in Customer'}</span>
                            </div>
                            <div className="is-flex is-justify-content-space-between">
                                <span>Type:</span>
                                <span>{receipt.type === 'cash' ? 'CASH SALE' : 'CREDIT INVOICE'}</span>
                            </div>
                        </div>

                        <hr style={{ borderTop: '1px dashed #ccc', margin: '1rem 0' }} />

                        {/* Items */}
                        <div className="mb-4">
                            <table style={{ width: '100%', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>Qty Item</th>
                                        <th style={{ textAlign: 'right', paddingBottom: '0.5rem' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receipt.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ paddingBottom: '0.25rem' }}>
                                                {item.quantity}x {item.name}<br />
                                                <span style={{ fontSize: '0.8rem', color: '#666' }}>@ {formatCurrency(item.price_cents)}/ea</span>
                                            </td>
                                            <td style={{ textAlign: 'right', verticalAlign: 'top', paddingBottom: '0.25rem' }}>
                                                {formatCurrency(item.price_cents * item.quantity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <hr style={{ borderTop: '1px dashed #ccc', margin: '1rem 0' }} />

                        {/* Total */}
                        <div className="is-flex is-justify-content-space-between mb-4 mt-2">
                            <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>TOTAL</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{formatCurrency(receipt.total)}</span>
                        </div>

                        {/* Footer */}
                        <div className="has-text-centered mt-5">
                            <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Thank you for your business!</p>
                            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>Powered by Bakery Ledger</p>
                        </div>
                    </div>
                </section>

                <footer className="modal-card-foot is-justify-content-space-between is-hidden-print">
                    <button className="button" onClick={onClose}>
                        <span className="icon"><CloseSquareBold size={16} /></span>
                        <span>Close</span>
                    </button>
                    <button className="button is-link" onClick={handlePrint} style={{ fontWeight: 'bold' }}>
                        <span className="icon"><PrinterBold size={16} /></span>
                        <span>Print Receipt</span>
                    </button>
                </footer>
            </div>
        </div>
    );
}

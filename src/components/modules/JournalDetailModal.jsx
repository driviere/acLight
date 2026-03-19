import React from 'react';
import { toDollarsData, formatCurrency } from '../../utils/moneyUtils';
import { PrinterBold, CloseSquareBold, DocumentTextBold, CalculatorBold, UsersGroupTwoRoundedBold, BuildingsBold } from 'solar-icon-set';

export default function JournalDetailModal({ isActive, entry, onClose }) {
    if (!isActive || !entry) return null;

    const meta = entry.metadata || {};
    const items = meta.items || [];
    const lines = entry.lines || [];
    const dateStr = entry.date?.seconds
        ? new Date(entry.date.seconds * 1000).toLocaleString()
        : new Date(entry.date).toLocaleString();

    const partyLabel = meta.customer_name || meta.vendor_name || 'Counter Sale';
    const isSale = ['sale', 'cash_sale', 'credit_sale'].includes(entry.type);

    return (
        <div className={`modal ${isActive ? 'is-active' : ''}`}>
            <div className="modal-background" onClick={onClose}></div>
            <div className="modal-card" style={{ maxWidth: '600px' }}>
                <header className="modal-card-head">
                    <p className="modal-card-title has-text-weight-bold">
                        <span className="icon mr-2">
                            {isSale ? <UsersGroupTwoRoundedBold size={24} /> : <BuildingsBold size={24} />}
                        </span>
                        {isSale ? 'Invoice Details' : 'Bill Details'}
                    </p>
                    <button className="delete" aria-label="close" onClick={onClose}></button>
                </header>

                <section className="modal-card-body">
                    <div className="columns is-multiline">
                        <div className="column is-6">
                            <p className="is-size-7 has-text-grey is-uppercase has-text-weight-bold">Reference #</p>
                            <p className="subtitle is-5">{entry.ref_no || 'N/A'}</p>
                        </div>
                        <div className="column is-6">
                            <p className="is-size-7 has-text-grey is-uppercase has-text-weight-bold">Date</p>
                            <p className="subtitle is-6">{dateStr}</p>
                        </div>
                        <div className="column is-12">
                            <p className="is-size-7 has-text-grey is-uppercase has-text-weight-bold">{isSale ? 'Customer' : 'Vendor'}</p>
                            <p className="subtitle is-5">{partyLabel}</p>
                        </div>
                    </div>

                    <hr />

                    {/* Itemized List (if available) */}
                    <p className="is-size-7 has-text-grey is-uppercase has-text-weight-bold mb-3">Itemized Breakdown</p>
                    {items.length > 0 ? (
                        <table className="table is-fullwidth is-narrow is-striped">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th className="has-text-centered">Qty</th>
                                    <th className="has-text-right">Price</th>
                                    <th className="has-text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="is-size-7">{item.name}</td>
                                        <td className="has-text-centered is-size-7">{item.quantity}</td>
                                        <td className="has-text-right is-size-7">{formatCurrency(item.price_cents)}</td>
                                        <td className="has-text-right is-size-7 has-text-weight-bold">{formatCurrency(item.price_cents * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="notification is-light py-3">
                            <p className="is-size-7 has-text-grey italic">
                                {meta.items_summary || 'No itemized breakdown available for this transaction.'}
                            </p>
                        </div>
                    )}

                    {/* Totals Summary */}
                    <div className="level is-mobile mt-4 px-2">
                        <div className="level-left"></div>
                        <div className="level-right" style={{ display: 'block', textAlign: 'right' }}>
                            {meta.subtotal_cents && meta.discount_cents > 0 && (
                                <>
                                    <p className="is-size-7">Subtotal: {formatCurrency(meta.subtotal_cents)}</p>
                                    <p className="is-size-7 has-text-danger">Discount: -{formatCurrency(meta.discount_cents)}</p>
                                </>
                            )}
                            <p className="title is-4 has-text-primary mt-1">Total: {formatCurrency(entry.total_cents)}</p>
                            {entry.outstanding_cents > 0 && (
                                <p className="subtitle is-6 has-text-danger">Balance Due: {formatCurrency(entry.outstanding_cents)}</p>
                            )}
                        </div>
                    </div>

                    <hr />

                    {/* Accounting Details */}
                    <p className="is-size-7 has-text-grey is-uppercase has-text-weight-bold mb-3">
                        <span className="icon mr-1"><CalculatorBold size={14} /></span>
                        Accounting Journal lines
                    </p>
                    <table className="table is-fullwidth is-narrow is-hoverable">
                        <thead>
                            <tr>
                                <th className="is-size-7">Account</th>
                                <th className="has-text-right is-size-7">Debit</th>
                                <th className="has-text-right is-size-7">Credit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, i) => (
                                <tr key={i}>
                                    <td className="is-size-7">{line.account_id}</td>
                                    <td className="has-text-right is-size-7">{line.debit > 0 ? formatCurrency(line.debit) : '—'}</td>
                                    <td className="has-text-right is-size-7">{line.credit > 0 ? formatCurrency(line.credit) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {meta.notes && (
                        <div className="box is-shadowless has-background-light p-3 mt-4">
                            <p className="is-size-7 has-text-grey is-uppercase has-text-weight-bold mb-1">Notes</p>
                            <p className="is-size-7">{meta.notes}</p>
                        </div>
                    )}
                </section>

                <footer className="modal-card-foot is-justify-content-flex-end">
                    <button className="button is-light" onClick={onClose}>
                        <span className="icon"><CloseSquareBold size={16} /></span>
                        <span>Close</span>
                    </button>
                    <button className="button is-link" onClick={() => window.print()}>
                        <span className="icon"><PrinterBold size={16} /></span>
                        <span>Print</span>
                    </button>
                </footer>
            </div>
        </div>
    );
}

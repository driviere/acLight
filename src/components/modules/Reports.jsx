import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTenant } from '../../contexts/TenantContext';
import { formatCurrency } from '../../utils/moneyUtils';
import { ChartSquareBold, CalendarBold, BanknoteBold, BillBold, LetterBold } from 'solar-icon-set';
import { PageHeader } from '../../App';

const SALE_TYPES = ['cash_sale', 'credit_sale', 'sale'];

function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
        download: filename,
    });
    a.click();
    URL.revokeObjectURL(a.href);
}

function StatCard({ label, value, grad, sub }) {
    return (
        <div className="column">
            <div className="bl-card-premium p-4 has-text-white" style={{ background: `var(--bl-grad-${grad})`, borderRadius: '16px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                <div className="is-size-7 has-text-weight-bold is-uppercase mb-2" style={{ opacity: 0.9, letterSpacing: '0.5px' }}>{label}</div>
                <div className="title is-5 has-text-white mb-0">{value}</div>
                {sub && <div className="is-size-7" style={{ opacity: 0.85 }}>{sub}</div>}
            </div>
        </div>
    );
}

export default function Reports() {
    const { tenantId, tenantData } = useTenant();
    const [activeTab, setActiveTab] = useState('pl');

    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [startDate, setStartDate] = useState(firstOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const [entries, setEntries] = useState([]);
    const [outstanding, setOutstanding] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingStatic, setLoadingStatic] = useState(false);

    // Period data — P&L and Sales Summary
    useEffect(() => {
        if (!tenantId) return;
        const fetch = async () => {
            setLoading(true);
            try {
                const startTS = Timestamp.fromDate(new Date(startDate + 'T00:00:00'));
                const endTS = Timestamp.fromDate(new Date(endDate + 'T23:59:59'));
                const snap = await getDocs(query(
                    collection(db, 'tenants', tenantId, 'journal_entries'),
                    where('date', '>=', startTS),
                    where('date', '<=', endTS),
                    orderBy('date', 'desc')
                ));
                setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        fetch();
    }, [tenantId, startDate, endDate]);

    // Static data — AR Aging and Balance Sheet
    useEffect(() => {
        if (!tenantId) return;
        const fetch = async () => {
            setLoadingStatic(true);
            try {
                const [outSnap, accSnap] = await Promise.all([
                    getDocs(query(
                        collection(db, 'tenants', tenantId, 'journal_entries'),
                        where('status', 'in', ['unpaid', 'partial']),
                        where('type', 'in', ['credit_sale', 'sale'])
                    )),
                    getDocs(collection(db, 'tenants', tenantId, 'accounts')),
                ]);
                setOutstanding(outSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setAccounts(accSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.id.localeCompare(b.id)));
            } catch (err) { console.error(err); }
            setLoadingStatic(false);
        };
        fetch();
    }, [tenantId]);

    // ── P&L calculations ──────────────────────────────────────────────────────
    const grossRevenue = entries.filter(e => SALE_TYPES.includes(e.type)).reduce((s, e) => s + (e.total_cents || 0), 0);
    const returns = entries.filter(e => e.type === 'sales_return').reduce((s, e) => s + (e.total_cents || 0), 0);
    const discounts = entries.reduce((s, e) => s + (e.metadata?.discount_cents || 0), 0);
    const netRevenue = grossRevenue - returns - discounts;
    const cogs = entries.filter(e => e.type === 'purchase').reduce((s, e) => s + (e.total_cents || 0), 0);
    const opex = entries.filter(e => e.type === 'expense').reduce((s, e) => s + (e.total_cents || 0), 0);
    const waste = entries.filter(e => e.type === 'waste').reduce((s, e) => s + (e.total_cents || 0), 0);
    const totalExpenses = cogs + opex + waste;
    const netProfit = netRevenue - totalExpenses;

    // ── AR Aging calculations ─────────────────────────────────────────────────
    const nowMs = Date.now();
    const agingBuckets = [
        { label: 'Current (0–30 days)', danger: false, entries: [] },
        { label: '31–60 Days', danger: false, entries: [] },
        { label: '61–90 Days', danger: false, entries: [] },
        { label: '90+ Days', danger: true, entries: [] },
    ];
    outstanding.forEach(e => {
        const days = Math.floor((nowMs - (e.date?.seconds || 0) * 1000) / 86400000);
        agingBuckets[days <= 30 ? 0 : days <= 60 ? 1 : days <= 90 ? 2 : 3].entries.push({ ...e, daysOld: days });
    });

    // ── Sales Summary calculations ────────────────────────────────────────────
    const salesByDay = {};
    entries.filter(e => SALE_TYPES.includes(e.type)).forEach(e => {
        const day = e.date?.seconds ? new Date(e.date.seconds * 1000).toLocaleDateString() : 'Unknown';
        if (!salesByDay[day]) salesByDay[day] = { cash: 0, credit: 0, count: 0 };
        if (e.type === 'cash_sale') salesByDay[day].cash += e.total_cents || 0;
        else salesByDay[day].credit += e.total_cents || 0;
        salesByDay[day].count++;
    });
    const salesDays = Object.entries(salesByDay).map(([date, v]) => ({ date, ...v, total: v.cash + v.credit }));

    // ── Balance Sheet calculations ─────────────────────────────────────────────
    const assetAccts = accounts.filter(a => a.type === 'asset');
    const liabilityAccts = accounts.filter(a => a.type === 'liability');
    const equityAccts = accounts.filter(a => a.type === 'equity');
    const revenueAccts = accounts.filter(a => a.type === 'revenue');
    const expenseAccts = accounts.filter(a => a.type === 'expense');
    const totalAssets = assetAccts.reduce((s, a) => s + (a.balance || 0), 0);
    const totalLiabilities = liabilityAccts.reduce((s, a) => s + (a.balance || 0), 0);
    const totalEquity = equityAccts.reduce((s, a) => s + (a.balance || 0), 0);
    const netIncome = revenueAccts.reduce((s, a) => s + (a.balance || 0), 0) - expenseAccts.reduce((s, a) => s + (a.balance || 0), 0);
    const totalEquityAndIncome = totalEquity + netIncome;
    const isBalanced = Math.abs(totalAssets - totalLiabilities - totalEquityAndIncome) < 2;

    // ── Export helpers ────────────────────────────────────────────────────────
    const periodLabel = `${startDate} to ${endDate}`;
    const bizName = tenantData?.name || 'Business';
    const todayStr = today.toLocaleDateString();

    const handleCSV = () => {
        let rows, filename;
        if (activeTab === 'pl') {
            rows = [
                ['Profit & Loss', periodLabel], [],
                ['REVENUE'],
                ['Gross Revenue', (grossRevenue / 100).toFixed(2)],
                ['Less: Returns', (returns / 100).toFixed(2)],
                ['Less: Discounts', (discounts / 100).toFixed(2)],
                ['Net Revenue', (netRevenue / 100).toFixed(2)], [],
                ['EXPENSES'],
                ['Cost of Goods Sold', (cogs / 100).toFixed(2)],
                ['Operating Expenses', (opex / 100).toFixed(2)],
                ['Waste / Spoilage', (waste / 100).toFixed(2)],
                ['Total Expenses', (totalExpenses / 100).toFixed(2)], [],
                ['NET PROFIT', (netProfit / 100).toFixed(2)],
            ];
            filename = `pl-${startDate}-to-${endDate}.csv`;
        } else if (activeTab === 'aging') {
            rows = [['AR Aging Report', todayStr], [], ['Customer', 'Invoice Ref', 'Invoice Date', 'Days', 'Amount Owed']];
            agingBuckets.forEach(b => {
                if (!b.entries.length) return;
                rows.push([b.label]);
                b.entries.forEach(e => rows.push([
                    e.metadata?.customer_name || '—', e.ref_no || '—',
                    e.date?.seconds ? new Date(e.date.seconds * 1000).toLocaleDateString() : '—',
                    e.daysOld, (e.outstanding_cents / 100).toFixed(2),
                ]));
            });
            filename = `ar-aging-${today.toISOString().split('T')[0]}.csv`;
        } else if (activeTab === 'sales') {
            rows = [
                ['Sales Summary', periodLabel], [],
                ['Date', 'Cash Sales', 'Credit Sales', 'Day Total', '# Transactions'],
                ...salesDays.map(d => [d.date, (d.cash / 100).toFixed(2), (d.credit / 100).toFixed(2), (d.total / 100).toFixed(2), d.count]),
            ];
            filename = `sales-${startDate}-to-${endDate}.csv`;
        } else {
            rows = [['Balance Sheet', todayStr], [], ['Account', 'Balance']];
            rows.push(['ASSETS']);
            assetAccts.forEach(a => rows.push([a.name || a.id, (a.balance / 100).toFixed(2)]));
            rows.push(['Total Assets', (totalAssets / 100).toFixed(2)], []);
            rows.push(['LIABILITIES']);
            liabilityAccts.forEach(a => rows.push([a.name || a.id, (a.balance / 100).toFixed(2)]));
            rows.push(['Total Liabilities', (totalLiabilities / 100).toFixed(2)], []);
            rows.push(['EQUITY']);
            equityAccts.forEach(a => rows.push([a.name || a.id, (a.balance / 100).toFixed(2)]));
            rows.push(['Net Income (Revenue − Expenses)', (netIncome / 100).toFixed(2)]);
            rows.push(['Total Equity + Net Income', (totalEquityAndIncome / 100).toFixed(2)]);
            filename = `balance-sheet-${today.toISOString().split('T')[0]}.csv`;
        }
        downloadCSV(rows, filename);
    };

    const handleEmail = () => {
        const labels = { pl: 'P&L', aging: 'AR Aging', sales: 'Sales Summary', balance: 'Balance Sheet' };
        const period = (activeTab === 'pl' || activeTab === 'sales') ? periodLabel : todayStr;
        let body = '';
        if (activeTab === 'pl') {
            body = `Profit & Loss — ${periodLabel}\n\nGross Revenue: ${formatCurrency(grossRevenue)}\nLess Returns: ${formatCurrency(returns)}\nLess Discounts: ${formatCurrency(discounts)}\nNet Revenue: ${formatCurrency(netRevenue)}\n\nCOGS: ${formatCurrency(cogs)}\nOperating Expenses: ${formatCurrency(opex)}\nWaste: ${formatCurrency(waste)}\nTotal Expenses: ${formatCurrency(totalExpenses)}\n\nNET PROFIT: ${formatCurrency(netProfit)}`;
        } else if (activeTab === 'aging') {
            const grandTotal = outstanding.reduce((s, e) => s + (e.outstanding_cents || 0), 0);
            body = `AR Aging Report — As of ${todayStr}\n\nTotal Outstanding: ${formatCurrency(grandTotal)}\nCurrent (0–30 days): ${formatCurrency(agingBuckets[0].entries.reduce((s, e) => s + (e.outstanding_cents || 0), 0))}\n31–60 Days: ${formatCurrency(agingBuckets[1].entries.reduce((s, e) => s + (e.outstanding_cents || 0), 0))}\n61–90 Days: ${formatCurrency(agingBuckets[2].entries.reduce((s, e) => s + (e.outstanding_cents || 0), 0))}\n90+ Days: ${formatCurrency(agingBuckets[3].entries.reduce((s, e) => s + (e.outstanding_cents || 0), 0))}`;
        } else if (activeTab === 'sales') {
            const grandSales = salesDays.reduce((s, d) => s + d.total, 0);
            const avg = salesDays.length ? Math.round(grandSales / salesDays.length) : 0;
            body = `Sales Summary — ${periodLabel}\n\nTotal Sales: ${formatCurrency(grandSales)}\nDays with Sales: ${salesDays.length}\nAvg Daily Sales: ${formatCurrency(avg)}`;
        } else {
            body = `Balance Sheet — As of ${todayStr}\n\nTotal Assets: ${formatCurrency(totalAssets)}\nTotal Liabilities: ${formatCurrency(totalLiabilities)}\nTotal Equity: ${formatCurrency(totalEquity)}\nNet Income: ${formatCurrency(netIncome)}\nTotal Equity + Net Income: ${formatCurrency(totalEquityAndIncome)}`;
        }
        window.location.href = `mailto:?subject=${encodeURIComponent(`${bizName} — ${labels[activeTab]} ${period}`)}&body=${encodeURIComponent(body)}`;
    };

    // ── Tab renderers ─────────────────────────────────────────────────────────

    const renderPL = () => {
        if (loading) return <Spinner />;
        return (
            <div>
                <div className="columns is-mobile mb-5">
                    <StatCard label="Net Revenue" value={formatCurrency(netRevenue)} grad="primary" />
                    <StatCard label="Total Expenses" value={formatCurrency(totalExpenses)} grad="danger" />
                    <StatCard label="Net Profit" value={formatCurrency(netProfit)} grad={netProfit >= 0 ? 'purple' : 'danger'} />
                </div>
                <table className="table is-fullwidth">
                    <tbody>
                        <tr><td colSpan={2} className="has-background-light has-text-weight-bold is-uppercase is-size-7 py-2" style={{ letterSpacing: '1px' }}>Revenue</td></tr>
                        <tr><td>Gross Revenue</td><td className="has-text-right has-text-weight-semibold">{formatCurrency(grossRevenue)}</td></tr>
                        <tr><td className="has-text-grey pl-5">Less: Sales Returns</td><td className="has-text-right has-text-grey">({formatCurrency(returns)})</td></tr>
                        <tr><td className="has-text-grey pl-5">Less: Discounts</td><td className="has-text-right has-text-grey">({formatCurrency(discounts)})</td></tr>
                        <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                            <td className="has-text-weight-bold">Net Revenue</td>
                            <td className="has-text-right has-text-weight-bold has-text-success">{formatCurrency(netRevenue)}</td>
                        </tr>
                        <tr><td colSpan={2} className="has-background-light has-text-weight-bold is-uppercase is-size-7 py-2 pt-4" style={{ letterSpacing: '1px' }}>Expenses</td></tr>
                        <tr><td>Cost of Goods Sold</td><td className="has-text-right">{formatCurrency(cogs)}</td></tr>
                        <tr><td>Operating Expenses</td><td className="has-text-right">{formatCurrency(opex)}</td></tr>
                        <tr><td>Waste / Spoilage</td><td className="has-text-right">{formatCurrency(waste)}</td></tr>
                        <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                            <td className="has-text-weight-bold">Total Expenses</td>
                            <td className="has-text-right has-text-weight-bold has-text-danger">{formatCurrency(totalExpenses)}</td>
                        </tr>
                        <tr style={{ borderTop: '3px solid #2d3748', background: netProfit >= 0 ? '#f0fdf9' : '#fff5f5' }}>
                            <td className="has-text-weight-bold is-size-5 py-3">Net Profit</td>
                            <td className={`has-text-right has-text-weight-bold is-size-5 py-3 ${netProfit >= 0 ? 'has-text-success' : 'has-text-danger'}`}>{formatCurrency(netProfit)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const renderAging = () => {
        if (loadingStatic) return <Spinner />;
        const grandTotal = outstanding.reduce((s, e) => s + (e.outstanding_cents || 0), 0);
        if (outstanding.length === 0) return <Empty message="No outstanding invoices." />;
        return (
            <div>
                <p className="is-size-7 has-text-grey mb-4">As of {todayStr} &mdash; Total Outstanding: <strong>{formatCurrency(grandTotal)}</strong></p>
                {agingBuckets.map((bucket, bi) => {
                    if (!bucket.entries.length) return null;
                    const bucketTotal = bucket.entries.reduce((s, e) => s + (e.outstanding_cents || 0), 0);
                    return (
                        <div key={bi} className="mb-5">
                            <div className="is-flex is-justify-content-space-between is-align-items-center mb-2">
                                <span className={`tag is-medium ${bucket.danger ? 'is-danger' : 'is-warning is-light'}`}>{bucket.label}</span>
                                <span className={`has-text-weight-bold ${bucket.danger ? 'has-text-danger' : ''}`}>{formatCurrency(bucketTotal)}</span>
                            </div>
                            <table className="table is-fullwidth is-hoverable is-narrowed">
                                <thead>
                                    <tr><th>Customer</th><th>Invoice Ref</th><th>Invoice Date</th><th className="has-text-right">Days</th><th className="has-text-right">Amount Owed</th></tr>
                                </thead>
                                <tbody>
                                    {bucket.entries.map(e => (
                                        <tr key={e.id} className={bucket.danger ? 'has-text-danger' : ''}>
                                            <td className="is-size-7">{e.metadata?.customer_name || '—'}</td>
                                            <td className="is-size-7">{e.ref_no || '—'}</td>
                                            <td className="is-size-7">{e.date?.seconds ? new Date(e.date.seconds * 1000).toLocaleDateString() : '—'}</td>
                                            <td className="has-text-right is-size-7">{e.daysOld}</td>
                                            <td className="has-text-right is-size-7 has-text-weight-bold">{formatCurrency(e.outstanding_cents)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderSales = () => {
        if (loading) return <Spinner />;
        if (!salesDays.length) return <Empty message="No sales in this period." />;
        const totalCash = salesDays.reduce((s, d) => s + d.cash, 0);
        const totalCredit = salesDays.reduce((s, d) => s + d.credit, 0);
        const grandSales = totalCash + totalCredit;
        const bestDay = salesDays.reduce((b, d) => d.total > (b?.total || 0) ? d : b, null);
        const avgDay = Math.round(grandSales / salesDays.length);
        return (
            <div>
                <div className="columns is-mobile mb-5">
                    <StatCard label="Total Sales" value={formatCurrency(grandSales)} grad="primary" />
                    <StatCard label="Avg Daily" value={formatCurrency(avgDay)} grad="purple" />
                    <StatCard label="Best Day" value={formatCurrency(bestDay?.total || 0)} grad="warning" sub={bestDay?.date} />
                </div>
                <table className="table is-fullwidth is-hoverable is-narrowed">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th className="has-text-right">Cash Sales</th>
                            <th className="has-text-right">Credit Sales</th>
                            <th className="has-text-right">Day Total</th>
                            <th className="has-text-right"># Trans.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesDays.map(d => (
                            <tr key={d.date}>
                                <td className="is-size-7">{d.date}</td>
                                <td className="has-text-right is-size-7">{d.cash > 0 ? formatCurrency(d.cash) : <span className="has-text-grey-light">—</span>}</td>
                                <td className="has-text-right is-size-7">{d.credit > 0 ? formatCurrency(d.credit) : <span className="has-text-grey-light">—</span>}</td>
                                <td className="has-text-right is-size-7 has-text-weight-bold">{formatCurrency(d.total)}</td>
                                <td className="has-text-right is-size-7">{d.count}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="has-background-light">
                            <th>Total ({salesDays.length} days)</th>
                            <th className="has-text-right">{formatCurrency(totalCash)}</th>
                            <th className="has-text-right">{formatCurrency(totalCredit)}</th>
                            <th className="has-text-right has-text-success">{formatCurrency(grandSales)}</th>
                            <th className="has-text-right">{salesDays.reduce((s, d) => s + d.count, 0)}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        );
    };

    const renderBalance = () => {
        if (loadingStatic) return <Spinner />;
        if (!accounts.length) return <Empty message="No account data available." />;

        const Section = ({ title, accts, total, colorClass }) => (
            <table className="table is-fullwidth mb-4">
                <thead>
                    <tr><th colSpan={2} className="has-background-light is-uppercase is-size-7 py-2" style={{ letterSpacing: '1px' }}>{title}</th></tr>
                </thead>
                <tbody>
                    {accts.map(a => (
                        <tr key={a.id}>
                            <td className="is-size-7">{a.name || a.id}</td>
                            <td className="has-text-right is-size-7">{formatCurrency(a.balance || 0)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <th className={colorClass}>Total {title}</th>
                        <th className={`has-text-right ${colorClass}`}>{formatCurrency(total)}</th>
                    </tr>
                </tfoot>
            </table>
        );

        return (
            <div>
                <p className="is-size-7 has-text-grey mb-4">As of {todayStr}</p>
                <Section title="Assets" accts={assetAccts} total={totalAssets} colorClass="has-text-success" />
                <Section title="Liabilities" accts={liabilityAccts} total={totalLiabilities} colorClass="has-text-danger" />

                {/* Equity with net income line */}
                <table className="table is-fullwidth mb-4">
                    <thead>
                        <tr><th colSpan={2} className="has-background-light is-uppercase is-size-7 py-2" style={{ letterSpacing: '1px' }}>Equity</th></tr>
                    </thead>
                    <tbody>
                        {equityAccts.map(a => (
                            <tr key={a.id}>
                                <td className="is-size-7">{a.name || a.id}</td>
                                <td className="has-text-right is-size-7">{formatCurrency(a.balance || 0)}</td>
                            </tr>
                        ))}
                        <tr>
                            <td className="is-size-7 has-text-grey">Net Income (Revenue − Expenses)</td>
                            <td className={`has-text-right is-size-7 ${netIncome >= 0 ? 'has-text-success' : 'has-text-danger'}`}>{formatCurrency(netIncome)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th className="has-text-info">Total Equity</th>
                            <th className="has-text-right has-text-info">{formatCurrency(totalEquityAndIncome)}</th>
                        </tr>
                    </tfoot>
                </table>

                {/* Accounting equation check */}
                <div className={`notification ${isBalanced ? 'is-success is-light' : 'is-warning is-light'}`}>
                    <strong>Assets {formatCurrency(totalAssets)} = Liabilities {formatCurrency(totalLiabilities)} + Equity {formatCurrency(totalEquityAndIncome)}</strong>
                    {isBalanced ? '  ✓ Balanced' : `  — Difference: ${formatCurrency(Math.abs(totalAssets - totalLiabilities - totalEquityAndIncome))}`}
                </div>
            </div>
        );
    };

    const TABS = [
        { key: 'pl', label: 'Profit & Loss' },
        { key: 'aging', label: 'AR Aging' },
        { key: 'sales', label: 'Sales Summary' },
        { key: 'balance', label: 'Balance Sheet' },
    ];
    const showDatePicker = activeTab === 'pl' || activeTab === 'sales';
    const tabRenderers = { pl: renderPL, aging: renderAging, sales: renderSales, balance: renderBalance };

    return (
        <div>
            <PageHeader title="Reports" subtitle="Financial reports and accounting summaries" icon={<ChartSquareBold size={24} />} />

            {/* Controls */}
            <div className="box has-background-light p-4 mb-4 no-print">
                <div className="is-flex is-justify-content-space-between is-align-items-center is-flex-wrap-wrap" style={{ gap: '12px' }}>
                    <div className="is-flex is-align-items-center" style={{ gap: '8px' }}>
                        {showDatePicker ? (
                            <>
                                <span className="icon is-small"><CalendarBold size={16} /></span>
                                <input className="input is-small" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '140px' }} />
                                <span className="is-size-7">to</span>
                                <input className="input is-small" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '140px' }} />
                            </>
                        ) : (
                            <span className="is-size-7 has-text-grey">As of {todayStr}</span>
                        )}
                    </div>
                    <div className="buttons are-small mb-0">
                        <button className="button is-light" onClick={handleCSV} title="Download CSV">
                            <span>⬇&nbsp;CSV</span>
                        </button>
                        <button className="button is-light" onClick={() => window.print()} title="Print / Save as PDF">
                            <span>🖨&nbsp;Print</span>
                        </button>
                        <button className="button is-light" onClick={handleEmail} title="Email report summary">
                            <span className="icon is-small"><LetterBold size={14} /></span>
                            <span>Email</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs is-boxed mb-0 no-print">
                <ul>
                    {TABS.map(t => (
                        <li key={t.key} className={activeTab === t.key ? 'is-active' : ''}>
                            <a onClick={() => setActiveTab(t.key)}>{t.label}</a>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="box" style={{ borderRadius: '0 12px 12px 12px' }}>
                {/* Print-only header */}
                <div className="print-only mb-4" style={{ display: 'none' }}>
                    <h2 className="title is-4 mb-1">{bizName}</h2>
                    <p className="subtitle is-6 has-text-grey">
                        {activeTab === 'pl' && `Profit & Loss — ${periodLabel}`}
                        {activeTab === 'aging' && `AR Aging Report — As of ${todayStr}`}
                        {activeTab === 'sales' && `Sales Summary — ${periodLabel}`}
                        {activeTab === 'balance' && `Balance Sheet — As of ${todayStr}`}
                    </p>
                    <hr />
                </div>
                {tabRenderers[activeTab]?.()}
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .app-header, .bl-navbar { display: none !important; }
                    .box { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
                    body { background: white !important; }
                }
            `}</style>
        </div>
    );
}

function Spinner() {
    return <div className="has-text-centered py-6"><button className="button is-loading is-white is-large" /></div>;
}

function Empty({ message }) {
    return <div className="notification is-light has-text-centered py-6"><p className="has-text-grey">{message}</p></div>;
}

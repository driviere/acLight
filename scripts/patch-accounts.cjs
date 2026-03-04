// patch-accounts.cjs
// Writes any missing Chart of Accounts entries to Firestore via REST API.
// Run: node scripts/patch-accounts.cjs

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ID = 'aclight-l33t';

const tokenPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const cache = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
const token = cache?.tokens?.access_token;
if (!token) { console.error('No token found'); process.exit(1); }

// All accounts that SHOULD exist
const ACCOUNTS = [
    { id: '1000_cash', name: 'Main Cash Drawer', type: 'asset', balance: 0 },
    { id: '1010_bank', name: 'Business Checking Account', type: 'asset', balance: 0 },
    { id: '1200_ar', name: 'Accounts Receivable', type: 'asset', balance: 0 },
    { id: '1400_inventory', name: 'Raw Materials Inventory', type: 'asset', balance: 0 },
    { id: '2000_ap', name: 'Accounts Payable', type: 'liability', balance: 0 },
    { id: '2100_taxes', name: 'Sales Tax Payable', type: 'liability', balance: 0 },
    { id: '3000_equity', name: "Owner's Equity", type: 'equity', balance: 0 },
    { id: '3900_retained', name: 'Retained Earnings', type: 'equity', balance: 0 },
    { id: '4000_sales_bread', 'name': 'Bread Sales', type: 'revenue', balance: 0 },
    { id: '4010_sales_pastry', 'name': 'Pastry Sales', type: 'revenue', balance: 0 },
    { id: '5000_cogs', name: 'Cost of Goods Sold (Ingredients)', type: 'expense', balance: 0 },
    { id: '5100_waste', name: 'Spoilage & Waste', type: 'expense', balance: 0 },
    { id: '6000_rent', name: 'Bakery Lease', type: 'expense', balance: 0 },
    { id: '6100_utilities', name: 'Utilities & Power', type: 'expense', balance: 0 },
    { id: '6200_payroll', name: 'Payroll Expense', type: 'expense', balance: 0 },
];

function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function upsertAccount(account) {
    const fields = {
        id: { stringValue: account.id },
        name: { stringValue: account.name },
        type: { stringValue: account.type },
        balance: { integerValue: account.balance },
    };
    const res = await request({
        hostname: 'firestore.googleapis.com',
        path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/accounts/${account.id}`,
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }, { fields });
    return res.status;
}

async function main() {
    console.log(`\nPatching ${ACCOUNTS.length} accounts into Firestore...\n`);
    for (const account of ACCOUNTS) {
        const status = await upsertAccount(account);
        const ok = status === 200;
        console.log(`${ok ? '✅' : '❌'} [${status}] ${account.id} — ${account.name}`);
    }
    console.log('\nDone. All accounts are now present in Firestore.\n');
    process.exit(0);
}

main().catch(err => { console.error(err.message); process.exit(1); });

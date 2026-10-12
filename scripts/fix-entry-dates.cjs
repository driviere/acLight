// fix-entry-dates.cjs
// Sets journal_entries.date = metadata.invoice_date for entries where they differ
// (expenses/purchases logged before ExpenseLogger started setting customDate).
// Dry run by default; writes a backup of old dates to scripts/date-backup-<ts>.json when applying.
// Run: node scripts/fix-entry-dates.cjs          (dry run)
//      node scripts/fix-entry-dates.cjs --apply  (write changes)

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ID = 'aclight-l33t';
const APPLY = process.argv.includes('--apply');
const BASE = `/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const tokenPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'))?.tokens?.access_token;
if (!token) { console.error('No token found'); process.exit(1); }

function request(method, urlPath, body) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'firestore.googleapis.com', path: urlPath, method,
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        }, res => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                const json = data ? JSON.parse(data) : {};
                if (res.statusCode >= 300) reject(new Error(`${res.statusCode}: ${data}`));
                else resolve(json);
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function listAll(collPath, extra = '') {
    const out = [];
    let pageToken = '';
    do {
        const res = await request('GET', `${BASE}/${collPath}?pageSize=300${extra}${pageToken ? `&pageToken=${pageToken}` : ''}`);
        out.push(...(res.documents || []));
        pageToken = res.nextPageToken || '';
    } while (pageToken);
    return out;
}

(async () => {
    const tenants = await listAll('tenants', '&showMissing=true');
    const backup = [];
    let scanned = 0;

    for (const t of tenants) {
        const tenantId = t.name.split('/').pop();
        const entries = await listAll(`tenants/${tenantId}/journal_entries`);
        for (const e of entries) {
            scanned++;
            const f = e.fields || {};
            const invDate = f.metadata?.mapValue?.fields?.invoice_date?.timestampValue;
            const date = f.date?.timestampValue;
            if (!invDate || !date) continue;
            if (new Date(invDate).getTime() === new Date(date).getTime()) continue;
            const id = e.name.split('/').pop();
            const ref = f.ref_no?.stringValue || '';
            console.log(`${tenantId}/${id} ${ref}: ${date} -> ${invDate}`);
            backup.push({ tenantId, id, ref_no: ref, old_date: date, new_date: invDate });
        }
    }

    console.log(`\nScanned ${scanned} entries; ${backup.length} need fixing.`);
    if (!APPLY || backup.length === 0) {
        if (!APPLY && backup.length) console.log('Dry run only. Re-run with --apply to write changes.');
        return;
    }

    const file = path.join(__dirname, `date-backup-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(backup, null, 2));
    console.log(`Backup written to ${file}`);

    for (const b of backup) {
        await request('PATCH',
            `${BASE}/tenants/${b.tenantId}/journal_entries/${b.id}?updateMask.fieldPaths=date`,
            { fields: { date: { timestampValue: b.new_date } } });
    }
    console.log(`Updated ${backup.length} entries.`);
})().catch(e => { console.error(e.message); process.exit(1); });

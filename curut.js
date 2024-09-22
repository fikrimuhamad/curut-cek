import fetch from 'node-fetch';
import fs from 'fs';
import readline from 'readline-sync';

function getToken(filename) {
    const data = fs.readFileSync(filename, 'utf8');
    return data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
}

async function getCURL(url, method = 'GET', headers = {}, body = null, returnJson = true) {
    const options = {
        method,
        headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = returnJson ? await response.json() : await response.text();
    
    return data;
}

function numberFormat(number, decimals = 0, decPoint = ',', thousandsSep = '.') {
    const n = parseFloat(number).toFixed(decimals);
    const parts = n.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
    return parts.join(decPoint);
}

function getFormattedData(numberString) {
    const parts = numberString.split('.'); 

    const totalDigits = parts.join('').length; 

    if (parts[0].length > 3) {
        if (totalDigits > 12) {
            return parseFloat(parts[0] + '.' + parts[1]);
        } else {
            return parseFloat(parts[0]);
        }
    } else if (parts[0].length === 1 && parts.length > 1) {
        return parseFloat(parts[0] + '.' + parts[1]);
    } else {
        return parseFloat(parts.slice(0, 2).join('.'));
    }
}

let totalAirdrop = 0;
let totalClaimed = 0;
let totalNextUnlocked = 0;
let totalUnclaimed = 0;

(async () => {
    const dataList = getToken('query.txt');
    
    console.log(`-------------------------------`);
    console.log(` |            MENU            | `);
    console.log(` [      HAMSTER AUTO CEK      ] `);
    console.log(`-------------------------------`);
    console.log();

    console.log('\n[.] MENJALANKAN AUTO CEK TOKEN, PADA ' + dataList.length + ' AKUN...');
    

    console.log();

    for (let i = 0; i < dataList.length; i += 100) {
        const batch = dataList.slice(i, i + 100);
        const batchPromises = batch.map(async (token, batchIndex) => {
            const no = i + batchIndex + 1;
            // Parsing query string menggunakan URLSearchParams
            const params = new URLSearchParams(token);
            const user = JSON.parse(decodeURIComponent(params.get('user')));

            // Bagian header data, original headers
            const originalHeaders = {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 7.1.2; SM-G9880 Build/PPR1.190810.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.193 Mobile Safari/537.36',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'sec-ch-ua': '"Android WebView";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
                'sec-ch-ua-platform': '"Android"',
                'origin': 'https://hamsterkombatgame.io',
                'x-requested-with': 'org.telegram.messenger'
            };

            let logMessage = `\n===============# [${getCurrentTime()}] #===============
[[#${no}] MENJALANKAN AUTO CEK DISTRI TOKEN DENGAN QUERY AKUN: ${user.username} ]\n`;

            try {
                const getToken = await getCURL('https://api.hamsterkombatgame.io/auth/auth-by-telegram-webapp', 'POST', originalHeaders, {"initDataRaw": token});
                if (getToken.status === 'Ok') {
                    const additionalHeader = {'Authorization': `Bearer ${getToken.authToken}`};
                    const headers = { ...originalHeaders, ...additionalHeader };

                    const asyc = await getCURL('https://api.hamsterkombatgame.io/interlude/sync', 'POST', headers, {});
                    if (asyc.interludeUser != null) {
                        const { total , claimed, nextUnlocked, unclaimed } = asyc.interludeUser.tokenBalance;
                        
                        const totals = getFormattedData(numberFormat(total));
                        const claimeds = getFormattedData(numberFormat(claimed));
                        const nextUnlockeds = getFormattedData(numberFormat(nextUnlocked));
                        const unclaimeds = getFormattedData(numberFormat(unclaimed));

                        logMessage += `  |-> AIRDROP TOKEN DISTRI INFO:\n  |-> TOTAL: ${numberFormat(totals)} $HMSTR | CLAIMED: ${numberFormat(claimeds)} $HMSTR | NEXT UNLOCK: ${numberFormat(nextUnlockeds)} $HMSTR | UNCLAIMED: ${numberFormat(unclaimeds)} $HMSTR\n`;

                        totalAirdrop += totals;
                        totalClaimed += claimeds;
                        totalNextUnlocked += nextUnlockeds;
                        totalUnclaimed += unclaimeds;
                    }
                } else {
                    logMessage += `[x] TOKEN QUERY_ID MOKAD!!\n`;
                }
            } catch (error) {
                logMessage += `[x] ERROR: ${error.message}\n`;
            }

            console.log(logMessage);
        });

        await Promise.all(batchPromises);
    }
    console.log(`===== TOTAL KESELURUHAN =====`);
    console.log(`Total Airdrop: ${numberFormat(totalAirdrop)} $HMSTR`);
    console.log(`Total Claimed: ${numberFormat(totalClaimed)} $HMSTR`);
    console.log(`Total Next Unlocked: ${numberFormat(totalNextUnlocked)} $HMSTR`);
    console.log(`Total Unclaimed: ${numberFormat(totalUnclaimed)} $HMSTR`);
    console.log(`[+] SEMUA AKUN BERHASIL DIPROSES...\n\n`);
    
})();
function getCurrentTime() {
    const now = new Date();
    const options = {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    const timeFormatter = new Intl.DateTimeFormat('en-GB', options);
    const timeParts = timeFormatter.formatToParts(now);

    const hours = timeParts.find(part => part.type === 'hour').value;
    const minutes = timeParts.find(part => part.type === 'minute').value;
    const seconds = timeParts.find(part => part.type === 'second').value;

    return `${hours}:${minutes}:${seconds}`;
}

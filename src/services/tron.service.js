function lazyRequireTronWeb() {
    try {
        // eslint-disable-next-line global-require
        const TronWeb = require('tronweb');
        return TronWeb;
    } catch (e) {
        return null;
    }
}

async function sendUSDT(privateKey, toAddress, amount, contractAddress) {
    const TronWeb = lazyRequireTronWeb();
    if (!TronWeb) {
        throw new Error('Auto withdraw unavailable: tronweb not installed');
    }
    const HttpProvider = TronWeb.providers.HttpProvider;
    const fullHost = process.env.TRON_FULLHOST || 'https://api.trongrid.io';
    const tronWeb = new TronWeb({ fullHost, privateKey });
    const decimals = Number(process.env.USDT_DECIMALS || 6);
    const value = BigInt(Math.round(Number(amount) * Math.pow(10, decimals)));
    const contract = await tronWeb.contract().at(contractAddress);
    const tx = await contract.transfer(toAddress, value).send();
    return tx;
}

const axios = require('axios');
async function getUSDTBalance(address) {
    try {
        const url = `https://apilist.tronscan.org/api/account?address=${address}&includeToken=true`;
        const res = await axios.get(url, { timeout: 15000 });
        const data = res && res.data ? res.data : null;
        if (!data) return null;
        const list = Array.isArray(data.trc20token_balances) ? data.trc20token_balances : [];
        const usdt = list.find(t => {
            const name = String(t.tokenName || '').toLowerCase();
            const id = String(t.tokenId || '').toUpperCase();
            const env = String(process.env.USDT_CONTRACT || '').toUpperCase();
            return name.includes('tether') || (env && id === env);
        });
        if (!usdt) return null;
        const dec = Number(usdt.tokenDecimal || 6);
        const raw = Number(usdt.balance || 0);
        const val = raw * Math.pow(10, -dec);
        return Number(val.toFixed(6));
    } catch (e) {
        return null;
    }
}

module.exports = { sendUSDT, getUSDTBalance };
function isValidTronAddress(address) {
    const TronWeb = lazyRequireTronWeb();
    if (!TronWeb) {
        return /^T[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(String(address || ''));
    }
    try {
        return TronWeb.isAddress(address);
    } catch (e) {
        return false;
    }
}

async function addressExists(address) {
    try {
        const host = process.env.TRON_FULLHOST || 'https://api.trongrid.io';
        const url = `${host}/v1/accounts/${address}`;
        const res = await axios.get(url, { timeout: 12000 });
        const data = res && res.data;
        if (!data) return false;
        const arr = Array.isArray(data.data) ? data.data : [];
        return arr.length > 0;
    } catch (e) {
        return false;
    }
}

module.exports.isValidTronAddress = isValidTronAddress;
module.exports.addressExists = addressExists;

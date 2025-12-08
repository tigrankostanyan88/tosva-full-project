const axios = require('axios');
const DB = require('../models');

async function fetchTrc20Transfers(toAddress, contractAddress, limit = 50) {
  const host = process.env.TRON_FULLHOST || 'https://api.trongrid.io';
  const url = `${host}/v1/accounts/${toAddress}/transactions/trc20?only_confirmed=true&contract_address=${contractAddress}&limit=${limit}`;
  const headers = {};
  if (process.env.TRONGRID_API_KEY) headers['TRON-PRO-API-KEY'] = process.env.TRONGRID_API_KEY;
  try {
    const res = await axios.get(url, { headers, timeout: 15000 });
    const data = res && res.data;
    return Array.isArray(data?.data) ? data.data : [];
  } catch (e) {
    return [];
  }
}

async function processTransfers(receiveAddress, transfers) {
  const Deposit = DB.models.Deposit;
  const depositService = require('../services/deposit.service');
  const decimals = Number(process.env.USDT_DECIMALS || 6);
  for (const tx of transfers) {
    const toAddr = (tx?.to || tx?.to_address || '').toLowerCase();
    if (!toAddr || toAddr !== String(receiveAddress).toLowerCase()) continue;

    const valueStr = tx?.value || tx?.amount || '0';
    const txid = tx?.transaction_id || tx?.txID || null;
    const amount = Number(valueStr) / Math.pow(10, decimals);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    if (txid) {
      const existingByTx = await Deposit.findOne({ where: { txid } });
      if (existingByTx && existingByTx.status === 'success') continue;
    }

    const pending = await Deposit.findOne({ where: { status: 'pending', provider: 'onchain', chain: 'TRON', amount } });
    if (!pending) continue;
    pending.txid = txid;
    await pending.save();
    await depositService.markSuccess(pending.id);
  }
}

async function tick() {
  const usdt = process.env.USDT_CONTRACT;
  if (!usdt) return;
  const listEnv = process.env.EXODUS_USDT_TRON_ADDRESSES || '';
  const single = process.env.EXODUS_USDT_TRON_ADDRESS || '';
  const addresses = listEnv
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (single) addresses.push(single);
  const uniq = Array.from(new Set(addresses));
  for (const addr of uniq) {
    const transfers = await fetchTrc20Transfers(addr, usdt, 50);
    if (transfers && transfers.length) await processTransfers(addr, transfers);
  }
}

function start() {
  const interval = Number(process.env.ONCHAIN_MONITOR_INTERVAL_MS || 45000);
  setInterval(tick, interval);
}

module.exports = { start };

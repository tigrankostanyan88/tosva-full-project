const DB = require('../models');
const { Op } = DB.Sequelize;

async function getInvitesCount(userId) {
  return await DB.models.User.count({ where: { referrer_id: userId } });
}

async function getInvites(userId, limit = 50, offset = 0) {
  return await DB.models.User.findAll({
    where: { referrer_id: userId },
    attributes: ['id', 'email', 'unique_tag', 'date'],
    order: [['id', 'DESC']],
    limit,
    offset
  });
}

async function getInvitesWithTotals(userId, limit = 50, offset = 0) {
  const invites = await DB.models.User.findAll({
    where: { referrer_id: userId },
    attributes: ['id', 'email', 'unique_tag', 'date'],
    order: [['id', 'DESC']],
    limit,
    offset,
    raw: true
  });
  const ids = invites.map(i => i.id);
  const totalsMap = {};
  if (ids.length) {
    const rows = await DB.models.Deposit.findAll({
      where: { user_id: { [Op.in]: ids }, status: 'success' },
      attributes: ['user_id', [DB.con.fn('SUM', DB.con.col('amount')), 'sum']],
      group: ['user_id'],
      raw: true
    });
    for (const r of rows) totalsMap[r.user_id] = Number(r.sum || 0);
  }
  return invites.map(i => ({ ...i, total_deposited: totalsMap[i.id] || 0 }));
}

function calcReferrerRate(base = 0.20, count = 0) {
  return base + (count * 0.10);
}

module.exports = { getInvitesCount, getInvites, getInvitesWithTotals, calcReferrerRate };

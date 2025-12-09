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

function calcReferrerRate(base = 0.20, count = 0) {
  return base + (count * 0.10);
}

async function getAllUsersWithReferrer(limit = 50, offset = 0) {
  const users = await DB.models.User.findAll({
    attributes: ['id', 'email', 'unique_tag', 'date', 'referrer_id', 'name'],
    order: [['id', 'ASC']],
    limit,
    offset,
    raw: true
  });
  const ids = Array.from(new Set(
    users
      .map(u => Number(u.referrer_id))
      .filter(v => Number.isInteger(v) && v > 0)
  ));
  let referrers = [];
  if (ids.length) {
    referrers = await DB.models.User.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: ['id', 'email', 'unique_tag', 'name'],
      raw: true
    });
  }
  const map = new Map(referrers.map(r => [r.id, r]));
  return users.map(u => ({
    ...u,
    referrer: map.get(Number(u.referrer_id)) || null
  }));
}

module.exports = { getInvitesCount, getInvites, calcReferrerRate, getAllUsersWithReferrer };

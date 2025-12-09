const DB = require('../models');

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

module.exports = { getInvitesCount, getInvites, calcReferrerRate };

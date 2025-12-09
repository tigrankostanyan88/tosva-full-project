const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const referralService = require('../services/referral.service');

exports.stats = catchAsync(async (req, res) => {
  const count = await referralService.getInvitesCount(req.user.id);
  const rate = referralService.calcReferrerRate(0.20, count);
  const invites = await referralService.getInvites(req.user.id, Number(req.query.limit || 50), Number(req.query.offset || 0));
  res.status(200).json({
    status: 'success',
    referral_count: count,
    interest_rate_for_referrer: rate,
    invites,
    time: (Date.now() - req.time) + ' ms'
  });
});

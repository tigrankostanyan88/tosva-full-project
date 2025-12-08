const router = require('express').Router();
const ctrls = require('../controllers');

router.use(ctrls.auth.protect);

router.post('/connect', ctrls.stripe.connect);
router.post('/account-link', ctrls.stripe.accountLink);
router.post('/attach-card', ctrls.stripe.attachCard);
router.post('/payout/test', ctrls.auth.restrictTo('admin'), ctrls.stripe.payoutTest);

module.exports = router;

const router = require('express').Router();
const ctrls = require('../controllers');

router.use(ctrls.auth.protect);

router.post('/withdraw', ctrls.wallet.withdraw);
router.get('/withdraws', ctrls.wallet.withdraws);

module.exports = router;

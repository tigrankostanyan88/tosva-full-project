const router = require('express').Router();
const ctrls = require('../controllers');

router.use(ctrls.auth.protect);

router.post('/', ctrls.deposit.create);
router.get('/', ctrls.deposit.list);
router.get('/:id/qr', ctrls.deposit.qr);

module.exports = router;

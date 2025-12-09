const router = require('express').Router();
const ctrls = require('../controllers');

router.use(ctrls.auth.protect);

router.post('/', ctrls.deposit.create);
router.get('/', ctrls.deposit.list);
router.get('/:id', ctrls.deposit.profile);
router.patch('/:id', ctrls.deposit.update);
router.get('/:id/qr', ctrls.deposit.qr);

module.exports = router;

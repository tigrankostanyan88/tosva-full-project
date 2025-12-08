const router = require('express').Router();
const ctrls = require('../controllers');

router.use(ctrls.auth.protect);

router.get('/profile', ctrls.deposit.profile);

module.exports = router;

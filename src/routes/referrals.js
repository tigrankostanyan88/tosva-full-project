const router = require('express').Router();
const ctrls = require('../controllers');

router.use(ctrls.auth.protect);

router.get('/', require('../controllers/referral').stats);

module.exports = router;

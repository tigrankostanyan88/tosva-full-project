const router = require('express').Router();
const ctrls = require('../controllers');

router.use(ctrls.auth.protect);

router.post('/submit', ctrls.bonus.claim);

module.exports = router;

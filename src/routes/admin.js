const router = require('express').Router();
const ctrls = require('../controllers');

router.use(ctrls.auth.protect);
router.use(ctrls.auth.restrictTo('admin'));

router.post('/deposits/:id/confirm', require('../controllers/admin').confirmDeposit);
router.get('/referrals/:userId', require('../controllers/admin').referralsStats);
router.get('/referrals/:userId/export', require('../controllers/admin').referralsExportCsv);
router.get('/code/slots', require('../controllers/admin').getCodeSlots);
router.post('/code/slots', require('../controllers/admin').setCodeSlots);
router.get('/code/current', require('../controllers/admin').currentCode);
router.get('/code/timezone', require('../controllers/admin').getAdminTimezone);
router.post('/code/timezone', require('../controllers/admin').setAdminTimezone);
router.get('/exodus/summary', require('../controllers/admin').exodusSummary);
router.post('/exodus/reaudit', require('../controllers/admin').exodusReaudit);
router.get('/withdraws', require('../controllers/admin.withdraws').list);
router.patch('/withdraws/:id/approve', require('../controllers/admin.withdraws').approve);
router.patch('/withdraws/:id/reject', require('../controllers/admin.withdraws').reject);
router.get('/withdraw/settings', require('../controllers/admin').getWithdrawSettings);
router.post('/withdraw/settings', require('../controllers/admin').setWithdrawSettings);

module.exports = router;

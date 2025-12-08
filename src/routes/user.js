// Modules
const router = require('express').Router();;

// Controllers
const ctrls = require('../controllers');

// User data access
router.use(ctrls.auth.isLoggedIn);


// Protected routes — attach middleware per route to avoid intercepting unknown paths

// Current user profile on GET /
router.get('/', ctrls.auth.protect, ctrls.deposit.profile);

// Admin users list
router.get('/list', ctrls.auth.protect, ctrls.auth.restrictTo('admin'), ctrls.user.getUsers);

router.patch('/updateMe', ctrls.auth.protect, ctrls.user.updateMe);
router.get('/logout', ctrls.auth.protect, ctrls.auth.logout);

router.patch('/updateMyPassword', ctrls.auth.protect, ctrls.auth.updatePassword);
router.delete('/delete', ctrls.auth.protect, ctrls.auth.deleteMe);

// Deposits
router.post('/deposit', ctrls.auth.protect, ctrls.deposit.create);
router.get('/deposits', ctrls.auth.protect, ctrls.deposit.list);
router.get('/profile', ctrls.auth.protect, ctrls.deposit.profile);

module.exports = router;

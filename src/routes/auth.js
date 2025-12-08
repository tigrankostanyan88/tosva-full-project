const router = require('express').Router();
const ctrls = require('../controllers');
const { validateRegister, validateLogin } = require('../validations/auth.validation');
const { loginLimiter } = require('../middlewares/rateLimit');

router.use(ctrls.auth.isLoggedIn);

router.post('/register', ctrls.auth.protectUser, validateRegister, ctrls.auth.signUp);
router.post('/login', loginLimiter, ctrls.auth.protectUser, validateLogin, ctrls.auth.signIn);

module.exports = router;

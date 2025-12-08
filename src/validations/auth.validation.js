const AppError = require('../utils/AppError');

function validateRegister(req, res, next) {
  const { email, password, name, referral_code } = req.body || {};
  const errors = [];
  if (!email || typeof email !== 'string' || !email.includes('@')) errors.push('email is invalid');
  if (!password || typeof password !== 'string' || password.length < 6) errors.push('password must be at least 6 chars');
  if (!name || typeof name !== 'string' || name.length < 2) errors.push('name is required');
  if (errors.length) return next(new AppError(errors[0], 400));
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];
  if (!email || typeof email !== 'string' || !email.includes('@')) errors.push('email is invalid');
  if (!password || typeof password !== 'string' || password.length < 6) errors.push('password must be at least 6 chars');
  if (errors.length) return next(new AppError(errors[0], 400));
  next();
}

module.exports = { validateRegister, validateLogin };

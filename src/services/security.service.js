const DB = require('../models');
const User = DB.models.User;

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

async function isLocked(user) {
  if (!user.lockUntil) return false;
  return user.lockUntil.getTime() > Date.now();
}

async function recordFailedLogin(user) {
  user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
  if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
    user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
    user.failedLoginAttempts = 0;
  }
  await user.save();
}

async function recordSuccessfulLogin(user) {
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();
}

module.exports = { isLocked, recordFailedLogin, recordSuccessfulLogin };

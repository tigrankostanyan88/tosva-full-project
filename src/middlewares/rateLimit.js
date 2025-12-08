const buckets = new Map();

function createRateLimiter({ windowMs, max, keyGenerator }) {
  return (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : req.ip;
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, reset: now + windowMs };
    if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + windowMs; }
    bucket.count += 1;
    buckets.set(key, bucket);
    if (bucket.count > max) {
      res.status(429).json({ status: 'fail', message: 'Too many requests, slow down' });
      return;
    }
    next();
  };
}

const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });

module.exports = { createRateLimiter, loginLimiter };

const { sendJson } = require("./_http");

const buckets = new Map();

function isRateLimited(key, windowMs, max) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { windowStart: now, count: 1 });
    return false;
  }
  if (bucket.count >= max) {
    return true;
  }
  bucket.count += 1;
  return false;
}

function getIp(req) {
  const xfwd = req.headers["x-forwarded-for"];
  if (typeof xfwd === "string" && xfwd.length > 0) {
    return xfwd.split(",")[0].trim();
  }
  return (
    (req.socket && req.socket.remoteAddress) ||
    (req.connection && req.connection.remoteAddress) ||
    "unknown"
  );
}

function checkRateLimit(req, res, userId) {
  const ip = getIp(req);

  // Per-IP: 100 requests per minute
  if (isRateLimited(`ip:${ip}`, 60 * 1000, 100)) {
    sendJson(res, 429, {
      error: "Too many requests from this IP. Please slow down.",
    });
    return true;
  }

  // Per-user: 1000 requests per hour
  if (userId) {
    if (isRateLimited(`user:${userId}`, 60 * 60 * 1000, 1000)) {
      sendJson(res, 429, {
        error: "Too many requests for this user. Please try again later.",
      });
      return true;
    }
  }

  return false;
}

module.exports = {
  checkRateLimit,
};


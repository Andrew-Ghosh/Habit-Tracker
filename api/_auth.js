function getAccessToken(req) {
  const header =
    req.headers["authorization"] || req.headers["Authorization"] || "";
  if (typeof header !== "string") return null;
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return null;
  return header.slice(prefix.length).trim();
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let payload = parts[1];
    // Convert base64url to base64
    payload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = payload.length % 4;
    if (pad) {
      payload += "=".repeat(4 - pad);
    }
    const json = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getUserIdFromToken(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  // Supabase usually stores the user id in `sub`
  return payload.sub || payload.user_id || null;
}

module.exports = {
  getAccessToken,
  getUserIdFromToken,
};


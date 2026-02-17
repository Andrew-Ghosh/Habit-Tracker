const { handleOptions, sendJson } = require("../_http");

// Supabase sessions are mostly managed client-side; this endpoint exists
// for symmetry and potential future server-side cleanup.
module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  // The frontend should clear its stored tokens; nothing else required here.
  return sendJson(res, 200, { message: "Logged out" });
};


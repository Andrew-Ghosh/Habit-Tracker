const { getSupabaseClient } = require("../_supabaseClient");
const { handleOptions, sendJson } = require("../_http");

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = req.body || {};
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }

  const { email, password } = body;

  if (!email || !password) {
    return sendJson(res, 400, { error: "Email and password are required" });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return sendJson(res, 400, { error: error.message });
    }

    return sendJson(res, 200, {
      user: data.user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}


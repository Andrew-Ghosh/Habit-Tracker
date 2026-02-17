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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return sendJson(res, 400, { error: error.message });
    }

    return sendJson(res, 200, {
      user: data.user,
      message: "Registration successful. Please check your email to confirm.",
    });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
};


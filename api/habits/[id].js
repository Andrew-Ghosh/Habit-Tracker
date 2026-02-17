const { getSupabaseClient } = require("../../_supabaseClient");
const { handleOptions, sendJson } = require("../../_http");
const { getAccessToken } = require("../../_auth");
const { checkRateLimit } = require("../../_rateLimit");

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const token = getAccessToken(req);
  if (!token) {
    return sendJson(res, 401, { error: "Missing or invalid Authorization header" });
  }

  const { id } = req.query || {};
  if (!id) {
    return sendJson(res, 400, { error: "Habit id is required" });
  }

  if (checkRateLimit(req, res)) return;

  if (req.method === "PUT") {
    return updateHabit(req, res, token, id);
  }

  if (req.method === "DELETE") {
    return deleteHabit(req, res, token, id);
  }

  return sendJson(res, 405, { error: "Method not allowed" });
};

async function updateHabit(req, res, accessToken, id) {
  let body;
  try {
    body = req.body || {};
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }

  const updates = {};
  if (typeof body.name === "string") {
    updates.name = body.name.trim();
  }
  if (typeof body.description === "string") {
    updates.description = body.description.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return sendJson(res, 400, { error: "Nothing to update" });
  }

  try {
    const supabase = getSupabaseClient(accessToken);
    const { data, error } = await supabase
      .from("habits")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return sendJson(res, 500, { error: error.message });
    }

    return sendJson(res, 200, { habit: data });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}

async function deleteHabit(req, res, accessToken, id) {
  try {
    const supabase = getSupabaseClient(accessToken);
    const { error } = await supabase.from("habits").delete().eq("id", id);

    if (error) {
      return sendJson(res, 500, { error: error.message });
    }

    return sendJson(res, 204, {});
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}


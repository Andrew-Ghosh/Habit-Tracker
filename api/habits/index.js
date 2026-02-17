const { getSupabaseClient } = require("../_supabaseClient");
const { handleOptions, sendJson } = require("../_http");
const { getAccessToken, getUserIdFromToken } = require("../_auth");
const { checkRateLimit } = require("../_rateLimit");

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const token = getAccessToken(req);
  if (!token) {
    return sendJson(res, 401, { error: "Missing or invalid Authorization header" });
  }

  const userId = getUserIdFromToken(token);
  if (!userId) {
    return sendJson(res, 401, { error: "Invalid access token" });
  }

  if (checkRateLimit(req, res, userId)) return;

  if (req.method === "GET") {
    return getHabits(req, res, token);
  }

  if (req.method === "POST") {
    return createHabit(req, res, token, userId);
  }

  return sendJson(res, 405, { error: "Method not allowed" });
};

async function getHabits(req, res, accessToken) {
  try {
    const supabase = getSupabaseClient(accessToken);
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return sendJson(res, 500, { error: error.message });
    }

    return sendJson(res, 200, { habits: data || [] });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}

async function createHabit(req, res, accessToken, userId) {
  let body;
  try {
    body = req.body || {};
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }

  const { name, description } = body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return sendJson(res, 400, { error: "Habit name is required" });
  }

  try {
    const supabase = getSupabaseClient(accessToken);

    // Enforce max 50 habits per user
    const { count, error: countError } = await supabase
      .from("habits")
      .select("*", { count: "exact", head: true });

    if (countError) {
      return sendJson(res, 500, { error: countError.message });
    }

    if ((count || 0) >= 50) {
      return sendJson(res, 400, {
        error: "Maximum of 50 habits allowed. Please delete some habits first.",
      });
    }

    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: userId,
        name: name.trim(),
        description: (description || "").trim() || null,
        check_dates: [],
      })
      .select("*")
      .single();

    if (error) {
      return sendJson(res, 500, { error: error.message });
    }

    return sendJson(res, 201, { habit: data });
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}


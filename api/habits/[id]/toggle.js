const { getSupabaseClient } = require("../../../_supabaseClient");
const { handleOptions, sendJson } = require("../../../_http");
const { getAccessToken } = require("../../../_auth");
const { checkRateLimit } = require("../../../_rateLimit");

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const token = getAccessToken(req);
  if (!token) {
    return sendJson(res, 401, { error: "Missing or invalid Authorization header" });
  }

  const { id } = req.query || {};
  if (!id) {
    return sendJson(res, 400, { error: "Habit id is required" });
  }

  if (checkRateLimit(req, res)) return;

  const today = new Date().toISOString().slice(0, 10);

  try {
    const supabase = getSupabaseClient(token);

    // Fetch current check_dates
    const { data: habit, error: fetchError } = await supabase
      .from("habits")
      .select("check_dates")
      .eq("id", id)
      .single();

    if (fetchError) {
      return sendJson(res, 500, { error: fetchError.message });
    }

    const current = Array.isArray(habit.check_dates) ? habit.check_dates : [];
    let next;
    if (current.includes(today)) {
      next = current.filter((d) => d !== today);
    } else {
      next = [...current, today].sort();
    }

    const { data, error } = await supabase
      .from("habits")
      .update({ check_dates: next })
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


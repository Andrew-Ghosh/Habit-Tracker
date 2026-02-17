const { createClient } = require("@supabase/supabase-js");

function getSupabaseClient(accessToken) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
  }

  const options = {};

  if (accessToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  return createClient(url, anonKey, options);
}

module.exports = {
  getSupabaseClient,
};


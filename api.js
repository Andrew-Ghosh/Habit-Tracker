// Simple API client for talking to our Vercel backend.
// All functions expect a valid access token from auth.js.

(function () {
  const API_BASE = ""; // relative to current origin

  async function request(method, path, token, body) {
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) {
      return null;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error =
        data && data.error
          ? data.error
          : `Request failed with status ${res.status}`;
      throw new Error(error);
    }

    return data;
  }

  const api = {
    async getHabits(token) {
      const data = await request("GET", "/api/habits", token);
      return data.habits || [];
    },
    async createHabit(token, habit) {
      const data = await request("POST", "/api/habits", token, habit);
      return data.habit;
    },
    async updateHabit(token, id, updates) {
      const data = await request("PUT", `/api/habits/${id}`, token, updates);
      return data.habit;
    },
    async deleteHabit(token, id) {
      await request("DELETE", `/api/habits/${id}`, token);
    },
    async toggleHabit(token, id) {
      const data = await request(
        "POST",
        `/api/habits/${id}/toggle`,
        token,
        null
      );
      return data.habit;
    },
  };

  window.api = api;
})();


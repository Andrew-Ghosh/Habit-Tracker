// Simple client-side auth manager that talks to our Vercel API.
// Stores the Supabase access token in localStorage and exposes
// a small API for the rest of the app.

(function () {
  const TOKEN_KEY = "habitTracker_authToken";
  const EMAIL_KEY = "habitTracker_authEmail";

  let accessToken = localStorage.getItem(TOKEN_KEY) || null;
  let email = localStorage.getItem(EMAIL_KEY) || null;
  const listeners = [];

  function notify() {
    const isAuthed = !!accessToken;
    listeners.forEach((fn) => {
      try {
        fn(isAuthed, { email, accessToken });
      } catch {
        // ignore listener errors
      }
    });
  }

  function setSession(token, userEmail) {
    accessToken = token;
    email = userEmail || null;
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (email) {
      localStorage.setItem(EMAIL_KEY, email);
    } else {
      localStorage.removeItem(EMAIL_KEY);
    }
    updateUi();
    notify();
  }

  function clearSession() {
    setSession(null, null);
  }

  function updateUi() {
    const authSection = document.getElementById("authSection");
    const appSection = document.getElementById("appSection");
    const userEmailEl = document.getElementById("userEmail");

    const isAuthed = !!accessToken;
    if (authSection && appSection) {
      authSection.hidden = isAuthed;
      appSection.hidden = !isAuthed;
    }
    if (userEmailEl) {
      userEmailEl.textContent = email || "";
    }
  }

  async function handleAuthSubmit(url, form, button) {
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    const errorEl = document.getElementById("authError");

    if (!emailInput || !passwordInput) return;

    const emailVal = emailInput.value.trim();
    const passwordVal = passwordInput.value;

    if (!emailVal || !passwordVal) {
      if (errorEl) errorEl.textContent = "Email and password are required.";
      return;
    }

    try {
      if (button) button.disabled = true;
      if (errorEl) errorEl.textContent = "";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailVal, password: passwordVal }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (errorEl) {
          errorEl.textContent = data.error || "Authentication failed.";
        }
        return;
      }

      // For login, we expect session tokens.
      if (data.session && data.session.access_token) {
        setSession(data.session.access_token, emailVal);
      } else {
        // For registration, ask user to log in after confirming email.
        if (errorEl) {
          errorEl.textContent =
            data.message ||
            "Registration successful. Please check your email, then log in.";
        }
      }
    } catch (err) {
      console.error(err);
      if (errorEl) {
        errorEl.textContent = "Network error. Please try again.";
      }
    } finally {
      if (button) button.disabled = false;
    }
  }

  function initAuthUi() {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const logoutBtn = document.getElementById("logoutButton");

    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const submitBtn = loginForm.querySelector("button[type=submit]");
        handleAuthSubmit("/api/auth/login", loginForm, submitBtn);
      });
    }

    if (signupForm) {
      signupForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const submitBtn = signupForm.querySelector("button[type=submit]");
        handleAuthSubmit("/api/auth/register", signupForm, submitBtn);
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        clearSession();
      });
    }

    updateUi();
  }

  window.auth = {
    getToken() {
      return accessToken;
    },
    getEmail() {
      return email;
    },
    onAuthChange(fn) {
      if (typeof fn === "function") {
        listeners.push(fn);
        // Call immediately with current state
        fn(!!accessToken, { email, accessToken });
      }
    },
    logout() {
      clearSession();
    },
    _setSession: setSession, // primarily for internal/testing
    initUi: initAuthUi,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateUi);
  } else {
    updateUi();
  }
})();


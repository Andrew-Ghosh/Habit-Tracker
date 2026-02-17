let habits = [];
let currentToken = null;

function getTodayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function getStreak(checkDates, today) {
  if (!checkDates || checkDates.length === 0) return 0;
  const set = new Set(checkDates);
  if (!set.has(today)) return 0;
  let count = 0;
  const todayDate = new Date(today);
  let d = new Date(todayDate);
  while (true) {
    const iso = d.toISOString().slice(0, 10);
    if (!set.has(iso)) break;
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function render() {
  const today = getTodayISO();
  const dateEl = document.getElementById("currentDate");
  if (dateEl) {
    const d = new Date();
    dateEl.textContent = d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const listEl = document.getElementById("habitList");
  if (!listEl) return;

  if (habits.length === 0) {
    listEl.innerHTML = '<p class="empty-state">No habits yet. Add one above.</p>';
    return;
  }

  listEl.innerHTML = "";
  for (const habit of habits) {
    const card = document.createElement("div");
    card.className = "habit-card";
    card.dataset.id = habit.id;

    const dates = habit.check_dates || [];
    const checked = dates.includes(today);
    const streak = getStreak(dates, today);
    const streakEmoji = streak === 0 ? "💨" : "🔥";
    const streakHtml = `<span class="streak">Streak: ${streak}<span class="streak-icon" aria-label="streak">${streakEmoji}</span></span>`;

    card.innerHTML = `
      <div class="habit-info">
        <p class="habit-name">${escapeHtml(habit.name)}</p>
        ${habit.description ? `<p class="habit-description">${escapeHtml(habit.description)}</p>` : ""}
      </div>
      <div class="habit-meta">
        <label>
          <input type="checkbox" ${checked ? "checked" : ""} data-action="toggle" aria-label="Mark habit done today">
        </label>
        ${streakHtml}
        <button type="button" class="edit-btn" data-action="edit">Edit</button>
        <button type="button" class="remove-btn" data-action="remove">Remove</button>
      </div>
    `;

    const checkbox = card.querySelector('input[data-action="toggle"]');
    const editBtn = card.querySelector('[data-action="edit"]');
    const removeBtn = card.querySelector('[data-action="remove"]');

    if (checkbox) {
      checkbox.addEventListener("change", async function () {
        if (!currentToken || !window.api) return;
        try {
          const updated = await window.api.toggleHabit(currentToken, habit.id);
          habits = habits.map((h) => (h.id === updated.id ? updated : h));
          render();
        } catch (err) {
          console.error(err);
          // Re-render to reset checkbox state
          render();
        }
      });
    }

    if (editBtn) {
      editBtn.addEventListener("click", async function () {
        if (!currentToken || !window.api) return;

        const current = habits.find((x) => x.id === habit.id);
        if (!current) return;

        const newName = window.prompt("Edit habit name:", current.name || "");
        if (newName === null) return; // cancelled
        const trimmedName = newName.trim();
        if (!trimmedName) return;

        const newDesc = window.prompt(
          "Edit description (optional):",
          current.description || ""
        );
        if (newDesc === null) return; // cancelled

        try {
          const updated = await window.api.updateHabit(currentToken, habit.id, {
            name: trimmedName,
            description: (newDesc || "").trim(),
          });
          habits = habits.map((h) => (h.id === updated.id ? updated : h));
          render();
        } catch (err) {
          console.error(err);
        }
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener("click", async function () {
        if (!currentToken || !window.api) return;
        try {
          await window.api.deleteHabit(currentToken, habit.id);
          habits = habits.filter((x) => x.id !== habit.id);
          render();
        } catch (err) {
          console.error(err);
        }
      });
    }

    listEl.appendChild(card);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function loadHabits() {
  if (!currentToken || !window.api) {
    habits = [];
    render();
    return;
  }
  try {
    habits = await window.api.getHabits(currentToken);
  } catch (err) {
    console.error(err);
    habits = [];
  }
  render();
}

function init() {
  render();

  const form = document.getElementById("addForm");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const nameInput = document.getElementById("habitName");
      const descInput = document.getElementById("habitDescription");
      const name = nameInput && nameInput.value;
      const desc = descInput && descInput.value;
      if (!name || !currentToken || !window.api) return;
      try {
        const created = await window.api.createHabit(currentToken, {
          name,
          description: desc || "",
        });
        habits.push(created);
        render();
        if (nameInput) nameInput.value = "";
        if (descInput) descInput.value = "";
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (window.auth && typeof window.auth.onAuthChange === "function") {
    window.auth.onAuthChange(function (isAuthed, info) {
      currentToken = isAuthed && info && info.accessToken ? info.accessToken : null;
      if (currentToken) {
        loadHabits();
      } else {
        habits = [];
        render();
      }
    });
  } else {
    // Fallback: no auth layer; keep empty
    habits = [];
    render();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

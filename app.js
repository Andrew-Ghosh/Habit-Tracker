const STORAGE_KEY = "habitTracker";

let habits = [];

function getTodayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    habits = raw ? JSON.parse(raw) : [];
  } catch {
    habits = [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
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

    const checked = habit.checkDates && habit.checkDates.includes(today);
    const streak = getStreak(habit.checkDates || [], today);
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

    checkbox.addEventListener("change", function () {
      const h = habits.find((x) => x.id === habit.id);
      if (!h) return;
      if (!h.checkDates) h.checkDates = [];
      if (h.checkDates.includes(today)) {
        h.checkDates = h.checkDates.filter((d) => d !== today);
      } else {
        h.checkDates.push(today);
        h.checkDates.sort();
      }
      save();
      render();
    });

    if (editBtn) {
      editBtn.addEventListener("click", function () {
        const h = habits.find((x) => x.id === habit.id);
        if (!h) return;

        const newName = window.prompt("Edit habit name:", h.name || "");
        if (newName === null) return; // cancelled
        const trimmedName = newName.trim();
        if (!trimmedName) return;

        const newDesc = window.prompt(
          "Edit description (optional):",
          h.description || ""
        );
        if (newDesc === null) return; // cancelled

        h.name = trimmedName;
        h.description = (newDesc || "").trim();
        save();
        render();
      });
    }

    removeBtn.addEventListener("click", function () {
      habits = habits.filter((x) => x.id !== habit.id);
      save();
      render();
    });

    listEl.appendChild(card);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function addHabit(name, description) {
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  habits.push({
    id,
    name: (name || "").trim(),
    description: (description || "").trim(),
    checkDates: [],
  });
  save();
  render();
}

function init() {
  load();
  render();

  const form = document.getElementById("addForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const nameInput = document.getElementById("habitName");
      const descInput = document.getElementById("habitDescription");
      const name = nameInput && nameInput.value;
      const desc = descInput && descInput.value;
      if (name) {
        addHabit(name, desc);
        if (nameInput) nameInput.value = "";
        if (descInput) descInput.value = "";
      }
    });
  }
}

init();

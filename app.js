const STORAGE_KEY = "ritmo-workouts-v1";
const dialog = document.querySelector("#workout-dialog");
const form = document.querySelector("#workout-form");
const formError = document.querySelector("#form-error");
const nameInput = document.querySelector("#workout-name");
const dayInput = document.querySelector("#workout-day");
const historyList = document.querySelector("#history-list");

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStart(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  return localDateKey(monday);
}

function loadWorkouts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  const workouts = JSON.parse(stored);
  if (!Array.isArray(workouts) || workouts.some((workout) =>
    !workout || typeof workout.name !== "string" || typeof workout.date !== "string" ||
    typeof workout.day !== "string" || typeof workout.id !== "string"
  )) {
    throw new Error("Os dados salvos dos treinos estão em um formato inválido.");
  }
  return workouts;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(year, month - 1, day));
}

function render(workouts) {
  const currentWeek = getWeekStart(new Date());
  const thisWeek = workouts.filter((workout) => getWeekStart(new Date(`${workout.date}T12:00:00`)) === currentWeek);
  document.querySelector("#weekly-count").innerHTML = `${thisWeek.length}<span>/5</span>`;
  document.querySelector("#total-count").textContent = String(workouts.length);

  document.querySelectorAll(".day-card").forEach((card) => {
    const done = thisWeek.some((workout) => workout.day === card.dataset.day);
    card.classList.toggle("is-done", done);
    card.querySelector(".day-complete").textContent = done ? "✓ FEITO" : "";
    card.querySelector(".log-button").innerHTML = done
      ? 'Treino registrado <span aria-hidden="true">✓</span>'
      : 'Registrar treino <span aria-hidden="true">→</span>';
  });

  historyList.replaceChildren();
  if (workouts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-history";
    empty.textContent = "Seu primeiro treino está esperando por você. ✳";
    historyList.append(empty);
    return;
  }

  [...workouts].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 8).forEach((workout) => {
    const entry = document.createElement("article");
    entry.className = "history-entry";
    const title = document.createElement("h3");
    title.className = "history-entry-name";
    title.textContent = workout.name;
    const meta = document.createElement("p");
    meta.className = "history-entry-meta";
    meta.textContent = `${workout.day} · ${formatDate(workout.date)}`;
    entry.append(title, meta);

    if (workout.duration) {
      const duration = document.createElement("span");
      duration.className = "history-entry-duration";
      duration.textContent = `${workout.duration} min`;
      entry.append(duration);
    }
    if (workout.notes) {
      const notes = document.createElement("p");
      notes.className = "history-entry-notes";
      notes.textContent = workout.notes;
      entry.append(notes);
    }
    historyList.append(entry);
  });
}

function openDialog(day, suggestedName) {
  form.reset();
  formError.textContent = "";
  dayInput.value = day;
  if (suggestedName) nameInput.value = suggestedName;
  dialog.showModal();
  nameInput.focus();
}

document.querySelector("#new-workout-button").addEventListener("click", () => {
  const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const today = dayNames[new Date().getDay()];
  openDialog(today, "");
});

document.querySelectorAll(".day-card").forEach((card) => {
  card.querySelector(".log-button").addEventListener("click", () => {
    openDialog(card.dataset.day, card.querySelector("h3").textContent);
  });
});

document.querySelector(".close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";
  const formData = new FormData(form);
  const workout = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(formData.get("name")).trim(),
    day: String(formData.get("day")),
    date: localDateKey(new Date()),
    duration: String(formData.get("duration")).trim(),
    notes: String(formData.get("notes")).trim()
  };
  if (!workout.name) {
    formError.textContent = "Informe o nome do treino para salvar.";
    nameInput.focus();
    return;
  }

  try {
    const workouts = loadWorkouts();
    workouts.push(workout);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
    render(workouts);
    dialog.close();
  } catch (error) {
    formError.textContent = `Não foi possível salvar seu treino: ${error.message}`;
  }
});

try {
  render(loadWorkouts());
} catch (error) {
  historyList.replaceChildren();
  const message = document.createElement("p");
  message.className = "empty-history";
  message.textContent = `Não foi possível carregar seus treinos: ${error.message}`;
  historyList.append(message);
}

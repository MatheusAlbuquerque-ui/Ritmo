const STORAGE_KEY = "ritmo-workouts-v1";
const PLAN_STORAGE_KEY = "ritmo-week-plan-v1";
const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DAY_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const DAY_ICONS = ["✳", "↗", "◈", "✦", "＋", "☼", "☾"];
const dialog = document.querySelector("#workout-dialog");
const form = document.querySelector("#workout-form");
const formError = document.querySelector("#form-error");
const nameInput = document.querySelector("#workout-name");
const dayInput = document.querySelector("#workout-day");
const exercisesInput = document.querySelector("#workout-exercises");
const durationInput = document.querySelector("#workout-duration");
const notesInput = document.querySelector("#workout-notes");
const historyList = document.querySelector("#history-list");
const weekGrid = document.querySelector("#week-grid");

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
    typeof workout.day !== "string" || typeof workout.id !== "string" ||
    (workout.exercises !== undefined &&
      (!Array.isArray(workout.exercises) || workout.exercises.some((exercise) => typeof exercise !== "string")))
  )) {
    throw new Error("Os dados salvos dos treinos estão em um formato inválido.");
  }
  return workouts.map((workout) => ({ ...workout, exercises: workout.exercises || [] }));
}

function loadPlans() {
  const stored = localStorage.getItem(PLAN_STORAGE_KEY);
  if (!stored) return {};
  const plans = JSON.parse(stored);
  if (!plans || typeof plans !== "object" || Array.isArray(plans) ||
      Object.entries(plans).some(([day, plan]) =>
        !DAY_NAMES.includes(day) || !plan || typeof plan.name !== "string" ||
        !Array.isArray(plan.exercises) || plan.exercises.some((exercise) => typeof exercise !== "string")
      )) {
    throw new Error("Os dados salvos dos planos estão em um formato inválido.");
  }
  return plans;
}

function parseExercises(value) {
  return value.split(/\r?\n/).map((exercise) => exercise.trim()).filter(Boolean);
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(year, month - 1, day));
}

function createExerciseList(exercises, className) {
  if (exercises.length === 0) return null;
  const list = document.createElement("ul");
  list.className = className;
  const visibleExercises = exercises.slice(0, 3);
  visibleExercises.forEach((exercise) => {
    const item = document.createElement("li");
    item.textContent = exercise;
    list.append(item);
  });
  if (exercises.length > visibleExercises.length) {
    const more = document.createElement("li");
    more.className = "more-exercises";
    more.textContent = `+ ${exercises.length - visibleExercises.length} exercícios`;
    list.append(more);
  }
  return list;
}

function renderWeek(plans, workouts) {
  const currentWeek = getWeekStart(new Date());
  const thisWeek = workouts.filter((workout) =>
    getWeekStart(new Date(`${workout.date}T12:00:00`)) === currentWeek
  );
  const completedDays = new Set(thisWeek.map((workout) => workout.day));
  const todayName = DAY_NAMES[(new Date().getDay() + 6) % 7];

  weekGrid.replaceChildren();
  DAY_NAMES.forEach((day, index) => {
    const plan = plans[day];
    const card = document.createElement("article");
    card.className = "day-card";
    card.dataset.day = day;
    if (completedDays.has(day)) card.classList.add("is-done");
    if (day === todayName) card.classList.add("is-today");
    card.style.setProperty("--card-order", String(index));

    const top = document.createElement("div");
    top.className = "day-card-top";
    const dayLabel = document.createElement("span");
    dayLabel.className = "day-name";
    dayLabel.textContent = DAY_LABELS[index];
    const dayIndex = document.createElement("span");
    dayIndex.className = "day-index";
    dayIndex.textContent = String(index + 1).padStart(2, "0");

    const icon = document.createElement("span");
    icon.className = "day-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = DAY_ICONS[index];

    const title = document.createElement("h3");
    title.textContent = plan ? plan.name : "Escolha seu foco";

    const description = document.createElement("p");
    description.className = plan ? "day-focus" : "day-focus is-unplanned";
    description.textContent = plan
      ? plan.exercises.length
        ? `${plan.exercises.length} ${plan.exercises.length === 1 ? "exercício no plano" : "exercícios no plano"}`
        : "Foco definido por você"
      : "Monte o treino do seu jeito";

    const exerciseList = plan ? createExerciseList(plan.exercises, "exercise-preview") : null;
    const actions = document.createElement("div");
    actions.className = "day-actions";
    const planButton = document.createElement("button");
    planButton.type = "button";
    planButton.className = "plan-button";
    planButton.dataset.action = "plan";
    planButton.textContent = plan ? "Editar plano" : "＋ Montar";
    const logButton = document.createElement("button");
    logButton.type = "button";
    logButton.className = "log-button";
    logButton.dataset.action = "workout";
    logButton.innerHTML = 'Treinar <span aria-hidden="true">→</span>';
    actions.append(planButton, logButton);

    const complete = document.createElement("span");
    complete.className = "day-complete";
    complete.setAttribute("aria-live", "polite");
    complete.textContent = completedDays.has(day) ? "✓ FEITO" : "";
    top.append(dayLabel, dayIndex, complete);

    card.append(top, icon, title, description);
    if (exerciseList) card.append(exerciseList);
    card.append(actions);
    weekGrid.append(card);
  });
}

function renderHistory(workouts) {
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
    if (workout.exercises.length > 0) {
      entry.append(createExerciseList(workout.exercises, "history-exercises"));
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

function render(workouts, plans) {
  const currentWeek = getWeekStart(new Date());
  const thisWeek = workouts.filter((workout) =>
    getWeekStart(new Date(`${workout.date}T12:00:00`)) === currentWeek
  );
  document.querySelector("#weekly-count").textContent = String(thisWeek.length);
  document.querySelector("#total-count").textContent = String(workouts.length);
  renderWeek(plans, workouts);
  renderHistory(workouts);
}

function openDialog(day, action) {
  const plans = loadPlans();
  const plan = plans[day];
  form.reset();
  formError.textContent = "";
  dayInput.value = day;
  if (action === "workout" && plan) {
    nameInput.value = plan.name;
    exercisesInput.value = plan.exercises.join("\n");
  } else if (action === "plan" && plan) {
    nameInput.value = plan.name;
    exercisesInput.value = plan.exercises.join("\n");
  }
  dialog.querySelector('[name="action"][value="plan"]').hidden = action === "workout";
  dialog.querySelector('[name="action"][value="workout"]').hidden = action === "plan";
  dialog.querySelector("#dialog-title").firstChild.textContent =
    action === "plan" ? "Montar treino" : "Registrar treino";
  dialog.showModal();
  nameInput.focus();
}

document.querySelector("#new-workout-button").addEventListener("click", () => {
  const today = DAY_NAMES[(new Date().getDay() + 6) % 7];
  openDialog(today, "workout");
});

weekGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  openDialog(button.closest(".day-card").dataset.day, button.dataset.action);
});

document.querySelector(".close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formError.textContent = "";
  const formData = new FormData(form);
  const name = String(formData.get("name")).trim();
  if (!name) {
    formError.textContent = "Informe o foco do treino para continuar.";
    nameInput.focus();
    return;
  }
  const day = String(formData.get("day"));
  const exercises = parseExercises(String(formData.get("exercises")));
  const action = event.submitter.value;

  try {
    if (action === "plan") {
      const plans = loadPlans();
      plans[day] = { name, exercises };
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans));
      render(loadWorkouts(), plans);
    } else {
      const workouts = loadWorkouts();
      workouts.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        day,
        date: localDateKey(new Date()),
        duration: String(formData.get("duration")).trim(),
        exercises,
        notes: String(formData.get("notes")).trim()
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
      render(workouts, loadPlans());
    }
    dialog.close();
  } catch (error) {
    formError.textContent = `Não foi possível salvar: ${error.message}`;
  }
});

try {
  render(loadWorkouts(), loadPlans());
} catch (error) {
  render([], {});
  const message = document.createElement("p");
  message.className = "empty-history";
  message.textContent = `Não foi possível carregar seus dados: ${error.message}`;
  historyList.replaceChildren(message);
}

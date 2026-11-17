const STORAGE_KEY = "ritmo-workouts-v1";
const PLAN_STORAGE_KEY = "ritmo-week-plan-v1";
const PROGRESS_STORAGE_KEY = "ritmo-progress-v1";
const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DAY_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const DAY_ICONS = ["✳", "↗", "◈", "✦", "＋", "☼", "☾"];
const EXERCISE_SUGGESTIONS = {
  peito: [
    { value: "geral", label: "Geral", exercises: ["Supino reto", "Supino inclinado com halteres", "Crucifixo na máquina"] },
    { value: "superior", label: "Parte superior", exercises: ["Supino inclinado", "Crossover na polia baixa", "Flexão com os pés elevados"] },
    { value: "inferior", label: "Parte inferior", exercises: ["Supino declinado", "Crossover na polia alta", "Paralelas assistidas"] }
  ],
  costas: [
    { value: "geral", label: "Geral", exercises: ["Puxada frontal", "Remada baixa", "Remada unilateral"] },
    { value: "largura", label: "Largura", exercises: ["Puxada aberta", "Puxada com pegada neutra", "Pullover na polia"] },
    { value: "espessura", label: "Espessura", exercises: ["Remada curvada", "Remada baixa", "Remada cavalinho"] }
  ],
  ombros: [
    { value: "geral", label: "Geral", exercises: ["Desenvolvimento com halteres", "Elevação lateral", "Face pull"] },
    { value: "lateral", label: "Deltoide lateral", exercises: ["Elevação lateral", "Elevação lateral na polia", "Desenvolvimento na máquina"] },
    { value: "posterior", label: "Deltoide posterior", exercises: ["Crucifixo inverso", "Face pull", "Elevação posterior inclinada"] },
    { value: "anterior", label: "Deltoide anterior", exercises: ["Desenvolvimento com halteres", "Elevação frontal", "Desenvolvimento na máquina"] }
  ],
  biceps: [
    { value: "geral", label: "Geral", exercises: ["Rosca direta", "Rosca alternada", "Rosca martelo"] },
    { value: "braquial", label: "Braquial e antebraço", exercises: ["Rosca martelo", "Rosca inversa", "Rosca martelo na corda"] }
  ],
  triceps: [
    { value: "geral", label: "Geral", exercises: ["Tríceps na polia", "Tríceps francês", "Supino com pegada fechada"] },
    { value: "cabeça-longa", label: "Cabeça longa", exercises: ["Tríceps francês", "Extensão acima da cabeça na polia", "Tríceps testa"] },
    { value: "cabeça-lateral", label: "Cabeça lateral", exercises: ["Tríceps na polia com corda", "Tríceps barra reta", "Mergulho no banco"] }
  ],
  pernas: [
    { value: "geral", label: "Geral", exercises: ["Agachamento", "Leg press", "Mesa flexora"] },
    { value: "quadriceps", label: "Quadríceps", exercises: ["Agachamento", "Cadeira extensora", "Leg press"] },
    { value: "posterior", label: "Posterior de coxa", exercises: ["Mesa flexora", "Levantamento terra romeno", "Cadeira flexora"] },
    { value: "panturrilhas", label: "Panturrilhas", exercises: ["Panturrilha em pé", "Panturrilha sentada", "Panturrilha no leg press"] }
  ],
  gluteos: [
    { value: "geral", label: "Geral", exercises: ["Elevação pélvica", "Agachamento", "Afundo"] },
    { value: "maximo", label: "Glúteo máximo", exercises: ["Elevação pélvica", "Coice na polia", "Levantamento terra romeno"] },
    { value: "medio", label: "Glúteo médio", exercises: ["Abdução de quadril", "Caminhada lateral com faixa", "Abdução na polia"] }
  ],
  abdomen: [
    { value: "geral", label: "Geral", exercises: ["Prancha", "Abdominal bicicleta", "Elevação de pernas"] },
    { value: "estabilidade", label: "Estabilidade do core", exercises: ["Prancha", "Dead bug", "Pallof press"] }
  ]
};
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
const measurementForm = document.querySelector("#measurement-form");
const measurementError = document.querySelector("#measurement-error");
const measurementList = document.querySelector("#measurement-list");
const recordForm = document.querySelector("#record-form");
const recordError = document.querySelector("#record-error");
const recordList = document.querySelector("#record-list");
const showSuggestionsInput = document.querySelector("#show-exercise-suggestions");
const suggestionsPanel = document.querySelector("#exercise-suggestions");
const suggestionMuscleInput = document.querySelector("#suggestion-muscle");
const suggestionEmphasisInput = document.querySelector("#suggestion-emphasis");
const suggestionHint = document.querySelector("#suggestion-hint");
const suggestionList = document.querySelector("#suggestion-list");
const installButton = document.querySelector("#install-app-button");
const installStatus = document.querySelector("#install-status");
const installDialog = document.querySelector("#install-dialog");
const installInstructions = document.querySelector("#install-instructions");
let deferredInstallPrompt = null;

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

function loadProgress() {
  const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (!stored) return { measurements: [], records: [] };
  const progress = JSON.parse(stored);
  const validMeasurement = (measurement) => measurement && typeof measurement.id === "string" &&
    typeof measurement.date === "string" &&
    ["weight", "height", "bodyFat"].every((key) =>
      measurement[key] === undefined || (typeof measurement[key] === "number" && Number.isFinite(measurement[key]))
    );
  const validRecord = (record) => record && typeof record.id === "string" &&
    typeof record.date === "string" && typeof record.exercise === "string" &&
    typeof record.weight === "number" && Number.isFinite(record.weight);
  if (!progress || typeof progress !== "object" || Array.isArray(progress) ||
      !Array.isArray(progress.measurements) || !progress.measurements.every(validMeasurement) ||
      !Array.isArray(progress.records) || !progress.records.every(validRecord)) {
    throw new Error("Os dados salvos da evolução estão em um formato inválido.");
  }
  return progress;
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function createEmptyState(message) {
  const empty = document.createElement("p");
  empty.className = "evolution-empty";
  empty.textContent = message;
  return empty;
}

function renderProgress(progress) {
  measurementList.replaceChildren();
  recordList.replaceChildren();
  const measurements = [...progress.measurements]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 6);
  const records = [...progress.records]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 8);

  if (measurements.length === 0) {
    measurementList.append(createEmptyState("Suas medidas registradas aparecerão aqui."));
  } else {
    measurements.forEach((measurement) => {
      const entry = document.createElement("article");
      entry.className = "evolution-entry";
      const date = document.createElement("span");
      date.className = "evolution-entry-date";
      date.textContent = formatDate(measurement.date);
      const values = document.createElement("p");
      values.className = "evolution-entry-values";
      values.textContent = [
        measurement.weight !== undefined ? `${measurement.weight} kg` : null,
        measurement.height !== undefined ? `${measurement.height} cm` : null,
        measurement.bodyFat !== undefined ? `${measurement.bodyFat}% gordura` : null
      ].filter(Boolean).join(" · ");
      entry.append(date, values);
      measurementList.append(entry);
    });
  }

  if (records.length === 0) {
    recordList.append(createEmptyState("Seus recordes de carga aparecerão aqui."));
  } else {
    records.forEach((record) => {
      const entry = document.createElement("article");
      entry.className = "evolution-entry record-entry";
      const details = document.createElement("div");
      const exercise = document.createElement("h4");
      exercise.className = "record-exercise";
      exercise.textContent = record.exercise;
      const date = document.createElement("span");
      date.className = "evolution-entry-date";
      date.textContent = formatDate(record.date);
      details.append(exercise, date);
      const weight = document.createElement("strong");
      weight.className = "record-weight";
      weight.textContent = `${record.weight} kg`;
      entry.append(details, weight);
      recordList.append(entry);
    });
  }
}

function updateSuggestionOptions() {
  const options = EXERCISE_SUGGESTIONS[suggestionMuscleInput.value];
  suggestionEmphasisInput.replaceChildren();
  if (!options) {
    suggestionEmphasisInput.disabled = true;
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Escolha o grupo primeiro";
    suggestionEmphasisInput.append(option);
    renderSuggestions();
    return;
  }
  suggestionEmphasisInput.disabled = false;
  options.forEach((emphasis) => {
    const option = document.createElement("option");
    option.value = emphasis.value;
    option.textContent = emphasis.label;
    suggestionEmphasisInput.append(option);
  });
  renderSuggestions();
}

function renderSuggestions() {
  suggestionList.replaceChildren();
  const options = EXERCISE_SUGGESTIONS[suggestionMuscleInput.value] || [];
  const emphasis = options.find((item) => item.value === suggestionEmphasisInput.value);
  if (!emphasis) {
    suggestionHint.textContent = "Escolha um grupo muscular para ver ideias. As sugestões são opcionais.";
    return;
  }
  const currentExercises = new Set(parseExercises(exercisesInput.value).map((exercise) => exercise.toLocaleLowerCase("pt-BR")));
  emphasis.exercises.forEach((exercise) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-item";
    button.dataset.exercise = exercise;
    const alreadyAdded = currentExercises.has(exercise.toLocaleLowerCase("pt-BR"));
    button.textContent = alreadyAdded ? `✓ ${exercise}` : `＋ ${exercise}`;
    button.disabled = alreadyAdded;
    suggestionList.append(button);
  });
  suggestionHint.textContent = "Toque em uma sugestão para adicioná-la ao treino, ou ignore esta lista.";
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
  suggestionsPanel.hidden = true;
  suggestionHint.textContent = "Escolha um grupo muscular para ver ideias. As sugestões são opcionais.";
  updateSuggestionOptions();
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

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((navLink) => navLink.classList.remove("active"));
    link.classList.add("active");
  });
});

document.querySelector(".close-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

showSuggestionsInput.addEventListener("change", () => {
  suggestionsPanel.hidden = !showSuggestionsInput.checked;
  if (showSuggestionsInput.checked) updateSuggestionOptions();
});
suggestionMuscleInput.addEventListener("change", updateSuggestionOptions);
suggestionEmphasisInput.addEventListener("change", renderSuggestions);
exercisesInput.addEventListener("input", renderSuggestions);
suggestionList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-exercise]");
  if (!button) return;
  const exercise = button.dataset.exercise;
  const current = exercisesInput.value.trim();
  const next = current ? `${current}\n${exercise}` : exercise;
  if (next.length > exercisesInput.maxLength) {
    suggestionHint.textContent = "A lista de exercícios atingiu o limite de caracteres.";
    return;
  }
  exercisesInput.value = next;
  renderSuggestions();
  suggestionHint.textContent = `${exercise} adicionado ao treino.`;
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
        id: createId(),
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

measurementForm.addEventListener("submit", (event) => {
  event.preventDefault();
  measurementError.textContent = "";
  const formData = new FormData(measurementForm);
  const values = ["weight", "height", "bodyFat"]
    .filter((key) => String(formData.get(key)).trim() !== "")
    .reduce((measurement, key) => {
      measurement[key] = Number(formData.get(key));
      return measurement;
    }, {});
  if (Object.keys(values).length === 0) {
    measurementError.textContent = "Preencha ao menos uma medida para salvar.";
    measurementForm.querySelector('[name="weight"]').focus();
    return;
  }
  try {
    const progress = loadProgress();
    progress.measurements.push({
      id: createId(),
      date: String(formData.get("date")),
      ...values
    });
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    renderProgress(progress);
    measurementForm.reset();
    measurementForm.elements.date.value = localDateKey(new Date());
  } catch (error) {
    measurementError.textContent = `Não foi possível salvar: ${error.message}`;
  }
});

recordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  recordError.textContent = "";
  const formData = new FormData(recordForm);
  try {
    const progress = loadProgress();
    progress.records.push({
      id: createId(),
      exercise: String(formData.get("exercise")).trim(),
      weight: Number(formData.get("weight")),
      date: String(formData.get("date"))
    });
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    renderProgress(progress);
    recordForm.reset();
    recordForm.elements.date.value = localDateKey(new Date());
  } catch (error) {
    recordError.textContent = `Não foi possível salvar: ${error.message}`;
  }
});

measurementForm.elements.date.value = localDateKey(new Date());
recordForm.elements.date.value = localDateKey(new Date());

function isAppInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

function showInstallInstructions() {
  const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  installInstructions.textContent = isAppleMobile
    ? "No Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”. Depois, abra o Ritmo pelo ícone criado."
    : "Abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”. Se essa opção não aparecer, use o menu Compartilhar do navegador.";
  installDialog.showModal();
}

if (isAppInstalled()) {
  installButton.hidden = true;
  installStatus.textContent = "O Ritmo já está instalado neste dispositivo.";
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
  installStatus.textContent = "O Ritmo foi adicionado à tela inicial.";
});

installButton.addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    showInstallInstructions();
    return;
  }
  await deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  if (choice.outcome === "accepted") {
    installButton.hidden = true;
    installStatus.textContent = "O Ritmo foi adicionado à tela inicial.";
  }
});

document.querySelector(".close-install-dialog").addEventListener("click", () => installDialog.close());
installDialog.addEventListener("click", (event) => {
  if (event.target === installDialog) installDialog.close();
});

if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.register("./service-worker.js").catch((error) => {
    console.error("Não foi possível preparar o Ritmo para uso offline.", error);
  });
}

try {
  render(loadWorkouts(), loadPlans());
  renderProgress(loadProgress());
} catch (error) {
  render([], {});
  const message = document.createElement("p");
  message.className = "empty-history";
  message.textContent = `Não foi possível carregar seus dados: ${error.message}`;
  historyList.replaceChildren(message);
  measurementList.replaceChildren(createEmptyState(`Não foi possível carregar: ${error.message}`));
  recordList.replaceChildren(createEmptyState(`Não foi possível carregar: ${error.message}`));
}

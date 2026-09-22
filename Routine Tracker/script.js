const defaultRoutine = [
  { id: "task-1", time: "6:00 - 6:45", activity: "Refreshing Time" },
  { id: "task-2", time: "7:00 - 7:45", activity: "Reading" },
  { id: "task-3", time: "7:45 - 8:10", activity: "Rest" },
  { id: "task-4", time: "8:15 - 9:15", activity: "Reading" },
  { id: "task-5", time: "9:20 - 11:15", activity: "Breakfast & Rest" },
  { id: "task-6", time: "11:20 - 12:00", activity: "Revision" },
  { id: "task-7", time: "12:00 - 12:30", activity: "Rest" },
  { id: "task-8", time: "12:30 - 3:00", activity: "MCQ Solving" },
  { id: "task-9", time: "3:10 - 7:00", activity: "Personal / Flexible Time" },
  { id: "task-10", time: "7:15 - 8:00", activity: "Reading" },
  { id: "task-11", time: "8:00 - 8:15", activity: "Rest" },
  { id: "task-12", time: "8:20 - 9:20", activity: "Revision" },
  { id: "task-13", time: "9:25 - 10:25", activity: "Dinner" },
  { id: "task-14", time: "10:30 - 11:20", activity: "Exercise & Rest" },
  { id: "task-15", time: "11:25 - 5:55", activity: "Sleep" }
];

const storageKeys = {
  routine: "routineflow-routine",
  progress: "routineflow-progress",
  notes: "routineflow-notes",
  theme: "routineflow-theme",
  selectedDay: "routineflow-selected-day"
};

let routine = getStorage(storageKeys.routine, defaultRoutine);
let progressData = getStorage(storageKeys.progress, {});
let notesData = getStorage(storageKeys.notes, {});
let selectedDay = Number(localStorage.getItem(storageKeys.selectedDay)) || 1;

const routineList = document.getElementById("routineList");
const dailyChecklist = document.getElementById("dailyChecklist");
const progressGrid = document.getElementById("progressGrid");
const daySelector = document.getElementById("daySelector");
const dailyNotes = document.getElementById("dailyNotes");

const quotes = [
  "Small daily improvements lead to remarkable results.",
  "Consistency is more important than perfection.",
  "Your future is created by what you do today.",
  "Discipline is choosing what you want most over what you want now.",
  "One focused day can change your entire week."
];

function getStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getDayProgress(day) {
  return progressData[day] || {};
}

function getCompletedCount(day) {
  const dayProgress = getDayProgress(day);
  return routine.filter(task => dayProgress[task.id]).length;
}

function getDayPercentage(day) {
  if (!routine.length) return 0;
  return Math.round((getCompletedCount(day) / routine.length) * 100);
}

function renderDaySelector() {
  daySelector.innerHTML = "";

  for (let day = 1; day <= 33; day++) {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = `Day ${day}`;
    option.selected = day === selectedDay;
    daySelector.appendChild(option);
  }
}

function renderRoutine() {
  routineList.innerHTML = "";

  if (!routine.length) {
    routineList.innerHTML = `
      <div class="empty-state">
        <p>No activities added yet. Add your first activity.</p>
      </div>
    `;
    return;
  }

  routine.forEach(task => {
    const item = document.createElement("article");
    item.className = "routine-item";

    item.innerHTML = `
      <span class="routine-time">${escapeHTML(task.time)}</span>
      <span class="routine-name">${escapeHTML(task.activity)}</span>
      <div class="task-actions">
        <button class="small-button edit-task" data-id="${task.id}">Edit</button>
        <button class="small-button delete delete-task" data-id="${task.id}">Delete</button>
      </div>
    `;

    routineList.appendChild(item);
  });

  document.querySelectorAll(".edit-task").forEach(button => {
    button.addEventListener("click", () => openEditTask(button.dataset.id));
  });

  document.querySelectorAll(".delete-task").forEach(button => {
    button.addEventListener("click", () => deleteTask(button.dataset.id));
  });
}

function renderChecklist() {
  const dayProgress = getDayProgress(selectedDay);

  document.getElementById("selectedDayTitle").textContent = `Day ${selectedDay}`;
  document.getElementById("currentDayStat").textContent = `Day ${selectedDay}`;

  dailyChecklist.innerHTML = "";

  if (!routine.length) {
    dailyChecklist.innerHTML = "<p>Add activities to begin tracking your routine.</p>";
    return;
  }

  routine.forEach(task => {
    const isDone = Boolean(dayProgress[task.id]);
    const item = document.createElement("label");

    item.className = `check-item ${isDone ? "completed" : ""}`;
    item.innerHTML = `
      <input type="checkbox" data-task-id="${task.id}" ${isDone ? "checked" : ""}>
      <span class="check-time">${escapeHTML(task.time)}</span>
      <span class="check-name">${escapeHTML(task.activity)}</span>
    `;

    dailyChecklist.appendChild(item);
  });

  document.querySelectorAll("#dailyChecklist input[type='checkbox']").forEach(checkbox => {
    checkbox.addEventListener("change", event => {
      const taskId = event.target.dataset.taskId;

      if (!progressData[selectedDay]) {
        progressData[selectedDay] = {};
      }

      progressData[selectedDay][taskId] = event.target.checked;
      saveStorage(storageKeys.progress, progressData);

      renderAll();
    });
  });

  dailyNotes.value = notesData[selectedDay] || "";
}

function renderProgressGrid() {
  progressGrid.innerHTML = "";

  for (let day = 1; day <= 33; day++) {
    const percentage = getDayPercentage(day);
    const tile = document.createElement("button");

    let stateClass = "";
    let stateText = "Not started";

    if (percentage === 100 && routine.length > 0) {
      stateClass = "complete";
      stateText = "Complete";
    } else if (percentage > 0) {
      stateClass = "partial";
      stateText = `${percentage}% done`;
    }

    tile.className = `day-tile ${stateClass}`;
    tile.innerHTML = `
      <strong>Day ${day}</strong>
      <small>${stateText}</small>
    `;

    tile.addEventListener("click", () => {
      selectedDay = day;
      localStorage.setItem(storageKeys.selectedDay, selectedDay);
      renderAll();
      document.querySelector(".tracker-panel").scrollIntoView({ behavior: "smooth" });
    });

    progressGrid.appendChild(tile);
  }
}

function updateStatistics() {
  const totalPossible = routine.length * 33;
  let completedTotal = 0;

  for (let day = 1; day <= 33; day++) {
    completedTotal += getCompletedCount(day);
  }

  const overallPercentage = totalPossible
    ? Math.round((completedTotal / totalPossible) * 100)
    : 0;

  const selectedCompleted = getCompletedCount(selectedDay);
  const selectedPercentage = getDayPercentage(selectedDay);

  document.getElementById("overallPercent").textContent = `${overallPercentage}%`;
  document.getElementById("overallProgressBar").style.width = `${overallPercentage}%`;
  document.getElementById("completedTasks").textContent = `${completedTotal} / ${totalPossible}`;

  document.getElementById("dayProgressText").textContent =
    `${selectedCompleted} of ${routine.length} complete`;

  document.getElementById("dayProgressBar").style.width = `${selectedPercentage}%`;
}

function renderAll() {
  renderDaySelector();
  renderRoutine();
  renderChecklist();
  renderProgressGrid();
  updateStatistics();
}

function openModal() {
  document.getElementById("taskModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("taskModal").classList.add("hidden");
  document.getElementById("taskForm").reset();
  document.getElementById("editTaskId").value = "";
  document.getElementById("modalTitle").textContent = "Add New Activity";
}

function openEditTask(id) {
  const task = routine.find(item => item.id === id);
  if (!task) return;

  document.getElementById("editTaskId").value = task.id;
  document.getElementById("taskTime").value = task.time;
  document.getElementById("taskActivity").value = task.activity;
  document.getElementById("modalTitle").textContent = "Edit Activity";

  openModal();
}

function deleteTask(id) {
  const task = routine.find(item => item.id === id);
  if (!task) return;

  const confirmed = confirm(`Delete "${task.activity}" from your routine?`);
  if (!confirmed) return;

  routine = routine.filter(item => item.id !== id);

  Object.keys(progressData).forEach(day => {
    delete progressData[day][id];
  });

  saveStorage(storageKeys.routine, routine);
  saveStorage(storageKeys.progress, progressData);

  showToast("Activity deleted.");
  renderAll();
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

document.getElementById("openTaskModal").addEventListener("click", () => {
  document.getElementById("modalTitle").textContent = "Add New Activity";
  document.getElementById("taskForm").reset();
  document.getElementById("editTaskId").value = "";
  openModal();
});

document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);
document.getElementById("modalOverlay").addEventListener("click", closeModal);

document.getElementById("taskForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = document.getElementById("editTaskId").value;
  const time = document.getElementById("taskTime").value.trim();
  const activity = document.getElementById("taskActivity").value.trim();

  if (!time || !activity) return;

  if (id) {
    const taskIndex = routine.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
      routine[taskIndex] = { id, time, activity };
      showToast("Activity updated successfully.");
    }
  } else {
    routine.push({
      id: `task-${Date.now()}`,
      time,
      activity
    });

    showToast("New activity added successfully.");
  }

  saveStorage(storageKeys.routine, routine);
  closeModal();
  renderAll();
});

daySelector.addEventListener("change", event => {
  selectedDay = Number(event.target.value);
  localStorage.setItem(storageKeys.selectedDay, selectedDay);
  renderAll();
});

dailyNotes.addEventListener("input", event => {
  notesData[selectedDay] = event.target.value;
  saveStorage(storageKeys.notes, notesData);
});

document.getElementById("resetButton").addEventListener("click", () => {
  const confirmation = confirm(
    "This will delete all completion ticks and notes for all 33 days. Continue?"
  );

  if (!confirmation) return;

  progressData = {};
  notesData = {};

  saveStorage(storageKeys.progress, progressData);
  saveStorage(storageKeys.notes, notesData);

  showToast("Progress and notes have been reset.");
  renderAll();
});

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  localStorage.setItem(storageKeys.theme, isDark ? "dark" : "light");

  document.getElementById("themeToggle").textContent = isDark ? "☀" : "☾";
});

function loadTheme() {
  const savedTheme = localStorage.getItem(storageKeys.theme);

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.getElementById("themeToggle").textContent = "☀";
  }
}

function setRandomQuote() {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById("motivationQuote").textContent = quote;
}

loadTheme();
setRandomQuote();
renderAll();